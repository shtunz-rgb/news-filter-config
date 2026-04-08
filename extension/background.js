/**
 * RemoteConfigManager - Fetches and manages remote site configurations
 */
class RemoteConfigManager {
  constructor(options = {}) {
    this.configUrl = options.configUrl || 'https://raw.githubusercontent.com/shtunz-rgb/news-filter-config/main/config.json';
    this.cacheDuration = options.cacheDuration || 24 * 60 * 60 * 1000;
    this.timeout = options.timeout || 5000;
    this.cacheKey = 'newsFilterRemoteConfig';
  }
  async getConfig() {
    try {
      const cached = await this.getCached();
      if (cached && !this.isCacheExpired(cached)) {
        console.log('[RemoteConfigManager] Using cached configuration (v' + cached.version + ')');
        return cached.config;
      }
      console.log('[RemoteConfigManager] Fetching from: ' + this.configUrl);
      const config = await this.fetchWithTimeout(this.configUrl, this.timeout);
      this.validateConfig(config);
      await this.setCached(config);
      console.log('[RemoteConfigManager] Successfully fetched configuration (v' + config.version + ')');
      return config;
    } catch (error) {
      console.error('[RemoteConfigManager] Error:', error.message);
      return this.getBuiltInConfig();
    }
  }
  async refreshConfig() {
    try {
      console.log('[RemoteConfigManager] Manual refresh requested');
      const config = await this.fetchWithTimeout(this.configUrl, this.timeout);
      this.validateConfig(config);
      await this.setCached(config);
      console.log('[RemoteConfigManager] Refresh successful (v' + config.version + ')');
      return config;
    } catch (error) {
      console.error('[RemoteConfigManager] Refresh failed:', error.message);
      const cached = await this.getCached();
      if (cached) return cached.config;
      return this.getBuiltInConfig();
    }
  }
  fetchWithTimeout(url, timeout) {
    return Promise.race([
      fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);
  }
  validateConfig(config) {
    if (!config.version || !config.sites) throw new Error('Invalid configuration format');
  }
  async getCached() {
    return new Promise(resolve => {
      chrome.storage.local.get([this.cacheKey], (result) => { resolve(result[this.cacheKey]); });
    });
  }
  async setCached(config) {
    return new Promise(resolve => {
      const data = { config: config, timestamp: Date.now(), version: config.version };
      chrome.storage.local.set({ [this.cacheKey]: data }, resolve);
    });
  }
  isCacheExpired(cached) {
    return Date.now() - cached.timestamp > this.cacheDuration;
  }
  getBuiltInConfig() {
    return {
      version: "4.9.0-builtin",
      lastUpdated: new Date().toISOString(),
      sites: {
        "yahoo.com": { enabled: true, priority: 10, articleSelectors: ["li.stream-item", "li.ntk-item"], headlineSelectors: ["h2", "h3"], substitutionMode: "overlay", infiniteScrollEnabled: true },
        "cnn.com": { enabled: true, priority: 9, articleSelectors: ["li.card.container__item"], headlineSelectors: ["span.container__headline-text"], substitutionMode: "overlay", infiniteScrollEnabled: false },
        "bbc.com": { enabled: true, priority: 8, articleSelectors: ["[data-testid='dundee-card']", "[data-testid='manchester-card']"], headlineSelectors: ["h2"], substitutionMode: "overlay", infiniteScrollEnabled: false }
      },
      fallback: { articleSelectors: ["article", ".article"], headlineSelectors: ["h1", "h2", "h3"] }
    };
  }
}

// ============================================================================
// V8.0.0: SUPABASE DATABASE REPLACEMENT ENGINE
// ============================================================================

const SUPABASE_URL = 'https://uuxypxtlgvyzhhzxihky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eHlweHRsZ3Z5emhoenhpaGt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgwMzI1NiwiZXhwIjoyMDkwMzc5MjU2fQ.CCxISLukFLalGqD5xfvEu8nbpLt2FO-Me77ZE_pfDQk';

// Track used replacement articles per tab to avoid duplicates
const usedReplacementsPerTab = new Map();

// Clean up tracking when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  usedReplacementsPerTab.delete(tabId);
  console.log('[DB v8.0.0] Cleaned up used replacements for tab ' + tabId);
});

/**
 * Derive layout_type from aspect ratio, matching the DB ingestion logic
 */
function deriveLayoutType(width, height) {
  if (!width || !height || height === 0) return 'unknown';
  const ratio = width / height;
  if (ratio > 1.6) return 'image-horizontal';
  if (ratio < 0.8) return 'image-vertical';
  return 'image-square';
}

/**
 * Query Supabase for the best replacement article matching the filtered article's
 * image dimensions, title length, and layout type.
 * Returns { title, url, image_url, actual_width, actual_height, section_name } or null
 */
async function fetchDBReplacement(params, tabId) {
  const { imageWidth, imageHeight, titleWordCount, keyword, site } = params;
  const layoutType = deriveLayoutType(imageWidth, imageHeight);
  
  console.log('[DB v8.0.0] Fetching replacement: layout=' + layoutType + 
    ', imgW=' + imageWidth + ', imgH=' + imageHeight + 
    ', titleWords=' + titleWordCount + ', keyword=' + keyword + ', site=' + site);

  try {
    // Map site identifier to source site_keys in the DB
    const siteKeyMap = {
      'cnn': 'cnn',
      'bbc': 'bbc',
      'yahoo': 'yahoo',
      'ynet': 'ynet'
    };
    const dbSiteKey = siteKeyMap[site] || site;

    // Build Supabase REST query:
    // - Join articles with sections and sources to filter by site
    // - Filter: is_excluded=false, has_image=true, layout_type matches
    // - Order by title_word_count proximity to target
    // - Return top 10 candidates for client-side filtering
    
    // Step 1: Get section IDs for this site's safe sections
    const sectionsUrl = SUPABASE_URL + '/rest/v1/sections?select=id,section_name,source_id!inner(site_key)' +
      '&source_id.site_key=eq.' + dbSiteKey +
      '&is_safe=eq.true';
    
    const sectionsResp = await fetch(sectionsUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    });
    
    if (!sectionsResp.ok) {
      console.error('[DB v8.0.0] Failed to fetch sections: HTTP ' + sectionsResp.status);
      return null;
    }
    
    const sections = await sectionsResp.json();
    if (!sections || sections.length === 0) {
      console.warn('[DB v8.0.0] No safe sections found for site: ' + site);
      return null;
    }
    
    const sectionIds = sections.map(s => s.id);
    const sectionNameMap = {};
    sections.forEach(s => { sectionNameMap[s.id] = s.section_name; });
    
    console.log('[DB v8.0.0] Found ' + sectionIds.length + ' safe sections for ' + site);

    // Step 2: Query articles matching layout_type from those sections
    const sectionFilter = 'section_id=in.(' + sectionIds.join(',') + ')';
    let articlesUrl = SUPABASE_URL + '/rest/v1/articles?select=id,title,url,image_url,actual_width,actual_height,display_width,display_height,title_word_count,layout_type,section_id' +
      '&is_excluded=eq.false' +
      '&has_image=eq.true' +
      '&' + sectionFilter +
      '&limit=50';
    
    // Add layout_type filter if we know it
    if (layoutType !== 'unknown') {
      articlesUrl += '&layout_type=eq.' + layoutType;
    }
    
    const articlesResp = await fetch(articlesUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    });
    
    if (!articlesResp.ok) {
      console.error('[DB v8.0.0] Failed to fetch articles: HTTP ' + articlesResp.status);
      return null;
    }
    
    let candidates = await articlesResp.json();
    console.log('[DB v8.0.0] Raw candidates: ' + candidates.length);
    
    if (!candidates || candidates.length === 0) {
      console.warn('[DB v8.0.0] No candidates found for layout: ' + layoutType);
      return null;
    }

    // Step 3: Filter out already-used articles for this tab
    const usedSet = usedReplacementsPerTab.get(tabId) || new Set();
    candidates = candidates.filter(a => !usedSet.has(a.url));
    
    if (candidates.length === 0) {
      console.warn('[DB v8.0.0] All candidates already used in this tab');
      return null;
    }

    // Step 4: Filter out articles whose title contains the filtered keyword
    if (keyword) {
      const kwLower = keyword.toLowerCase();
      candidates = candidates.filter(a => !a.title.toLowerCase().includes(kwLower));
    }
    
    if (candidates.length === 0) {
      console.warn('[DB v8.0.0] All candidates contain the filtered keyword');
      return null;
    }

    // Step 5: Score candidates by image size proximity + title word count proximity
    const targetW = imageWidth || 0;
    const targetH = imageHeight || 0;
    const targetWords = titleWordCount || 0;
    
    const scored = candidates.map(article => {
      let score = 100;
      
      // Image width proximity (using actual_width from DB)
      const aw = article.actual_width || article.display_width || 0;
      const ah = article.actual_height || article.display_height || 0;
      
      if (targetW > 0 && aw > 0) {
        const widthPct = Math.abs(aw - targetW) / targetW;
        if (widthPct < 0.2) score += 40;       // Within 20% — excellent
        else if (widthPct < 0.4) score += 20;   // Within 40% — good
        else if (widthPct < 0.6) score += 5;    // Within 60% — acceptable
        else score -= 20;                        // Beyond 60% — penalised
      }
      
      if (targetH > 0 && ah > 0) {
        const heightPct = Math.abs(ah - targetH) / targetH;
        if (heightPct < 0.2) score += 40;
        else if (heightPct < 0.4) score += 20;
        else if (heightPct < 0.6) score += 5;
        else score -= 20;
      }
      
      // Title word count proximity
      const wordDiff = Math.abs((article.title_word_count || 0) - targetWords);
      if (wordDiff <= 2) score += 30;
      else if (wordDiff <= 5) score += 15;
      else if (wordDiff <= 8) score += 5;
      else score -= 10;
      
      return { article, score };
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    const best = scored[0];
    console.log('[DB v8.0.0] Best match: "' + best.article.title + '" (score: ' + best.score + ')');
    
    // Mark as used for this tab
    if (!usedReplacementsPerTab.has(tabId)) {
      usedReplacementsPerTab.set(tabId, new Set());
    }
    usedReplacementsPerTab.get(tabId).add(best.article.url);
    
    // Return the replacement data
    return {
      title: best.article.title,
      url: best.article.url,
      imageUrl: best.article.image_url,
      actualWidth: best.article.actual_width,
      actualHeight: best.article.actual_height,
      displayWidth: best.article.display_width,
      displayHeight: best.article.display_height,
      section: sectionNameMap[best.article.section_id] || 'other',
      score: best.score
    };
    
  } catch (error) {
    console.error('[DB v8.0.0] Error fetching DB replacement:', error);
    return null;
  }
}

// V6.2.2: Import all required scripts for service worker
try {
  importScripts(
    'site-detector.js',
    'extractors/cnn-extractor.js',
    'extractors/bbc-extractor.js',
    'extractors/ynet-extractor.js',
    'extractors/yahoo-extractor.js',
    'cnn-sections-config.js',
    'bbc-sections-config.js',
    'ynet-sections-config.js',
    'yahoo-sections-config.js',
    'section-articles-fetcher.js'
  );
  console.log('[Background v6.2.5] All scripts imported successfully');
} catch (error) {
  console.error('[Background v6.2.5] Error importing scripts:', error);
}

// Initialize remote configuration manager
const configManager = new RemoteConfigManager({
  configUrl: 'https://raw.githubusercontent.com/shtunz-rgb/news-filter-config/main/config.json',
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  timeout: 5000
});

// Fetch config on extension install/update
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Background] Extension installed/updated, fetching remote config');
  try {
    await configManager.getConfig();
    console.log('[Background] Remote config loaded successfully');
  } catch (error) {
    console.error('[Background] Failed to load remote config:', error);
  }
});

// Fetch config every 6 hours
chrome.alarms.create('updateConfig', { periodInMinutes: 360 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'updateConfig') {
    console.log('[Background] Periodic config update triggered');
    try {
      await configManager.getConfig();
      console.log('[Background] Remote config updated successfully');
    } catch (error) {
      console.error('[Background] Failed to update remote config:', error);
    }
  }
});

// Allow manual refresh from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshConfig') {
    console.log('[Background v6.1.2] Manual config refresh requested');
    configManager.getConfig().then(async (config) => {
      sendResponse({ 
        success: true, 
        version: config.version
      });
    }).catch((error) => {
      console.error('[Background v6.1.2] Config refresh error:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    });
    return true;
  }
  
  // V6.2.0: Handle section article fetching requests (multi-site support)
  if (request.action === 'fetchSectionArticles') {
    const sectionKey = request.sectionKey;
    const siteKey = request.siteKey; // New: site key parameter
    console.log('[Background v6.2.0] Fetching articles for ' + siteKey + ':' + sectionKey);
    
    if (!sectionFetcher) {
      console.error('[Background v6.2.0] sectionFetcher not initialized');
      sendResponse({
        success: false,
        error: 'Section fetcher not initialized',
        section: sectionKey,
        site: siteKey
      });
      return true;
    }
    
    // Pass both siteKey and sectionKey to fetcher
    sectionFetcher.fetchSectionArticles(sectionKey, siteKey)
      .then(articles => {
        console.log('[Background v6.2.0] Successfully fetched ' + articles.length + ' articles for ' + siteKey + ':' + sectionKey);
        sendResponse({
          success: true,
          articles: articles,
          section: sectionKey,
          site: siteKey
        });
      })
      .catch(error => {
        console.error('[Background v6.2.0] Error fetching section articles:', error);
        sendResponse({
          success: false,
          error: error.message,
          section: sectionKey,
          site: siteKey
        });
      });
    
    return true;
  }
  
  // V6.2.0: Get all available sections for a site
  if (request.action === 'getSections') {
    const siteKey = request.siteKey; // New: site key parameter
    console.log('[Background v6.2.0] getSections requested for site: ' + siteKey);
    
    if (!sectionFetcher) {
      console.error('[Background v6.1.2] sectionFetcher not initialized');
      sendResponse({
        success: false,
        error: 'Section fetcher not initialized',
        sections: []
      });
      return true;
    }
    
    const sections = sectionFetcher.getAllSections(siteKey);
    console.log('[Background v6.2.0] Returning ' + sections.length + ' sections for ' + siteKey);
    sendResponse({
      success: true,
      sections: sections,
      site: siteKey
    });
    return true;
  }
  
  if (request.action === 'getStatus') {
    chrome.storage.sync.get(['keywords', 'isEnabled'], (result) => {
      sendResponse({
        isEnabled: result.isEnabled !== undefined ? result.isEnabled : true,
        keywordsCount: (result.keywords || []).length,
        filteredCount: request.filteredCount || 0
      });
    });
    return true;
  }
  
  if (request.action === 'updateFilterCount') {
    const count = request.count || 0;
    console.log('[Background v6.1.2] Received filtered count update: ' + count);
    sendResponse({ success: true });
    return true;
  }
  
  // V8.0.0: Handle database replacement requests for image articles
  if (request.action === 'fetchDBReplacement') {
    const tabId = sender.tab ? sender.tab.id : 0;
    console.log('[Background v8.0.0] DB replacement requested from tab ' + tabId);
    
    fetchDBReplacement(request.params, tabId)
      .then(replacement => {
        if (replacement) {
          console.log('[Background v8.0.0] Returning replacement: "' + replacement.title + '"');
          sendResponse({ success: true, replacement: replacement });
        } else {
          console.warn('[Background v8.0.0] No replacement found');
          sendResponse({ success: false, error: 'No suitable replacement found' });
        }
      })
      .catch(error => {
        console.error('[Background v8.0.0] DB replacement error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

/**
 * Background service worker for the News Filter extension v4.9
 * Handles CSP bypass for problematic domains and messaging
 */

const PROBLEMATIC_DOMAINS = [
  'nytimes.com',
  'reuters.com',
  'thehill.com',
  'breitbart.com',
  'zerohedge.com'
];

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(() => {
  // Set default values in storage
  chrome.storage.sync.get(['keywords', 'isEnabled'], (result) => {
    if (!result.keywords) {
      chrome.storage.sync.set({ keywords: [] });
    }
    
    if (result.isEnabled === undefined) {
      chrome.storage.sync.set({ isEnabled: true });
    }
  });
  
  console.log('[News Filter v6.1.2] Extension installed.');
});

/**
 * Listen for tab updates to inject content script on problematic domains
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if the tab has completed loading and has a URL
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if the URL is from a problematic domain
    const isProblematicDomain = PROBLEMATIC_DOMAINS.some(domain => tab.url.includes(domain));
    
    if (isProblematicDomain) {
      console.log('[News Filter v6.1.2] Detected problematic domain in ' + tab.url);
      
      // Programmatically inject the content script to bypass CSP
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/index.js'],
        world: 'MAIN'
      }).then(() => {
        console.log('[News Filter v6.1.2] Content script injected into tab ' + tabId);
      }).catch(err => {
        console.error('[News Filter v6.1.2] Error injecting content script: ' + err);
      });
    }
  }
});



/**
 * Optional: Add context menu functionality (currently disabled)
 * Uncomment to enable right-click "Add to filter" functionality
 */
/*
chrome.contextMenus.create({
  id: "addToFilter",
  title: "Add to content filter",
  contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToFilter" && info.selectionText) {
    const keyword = info.selectionText.trim();
    
    chrome.storage.sync.get(['keywords'], (result) => {
      const keywords = result.keywords || [];
      
      if (!keywords.includes(keyword)) {
        keywords.push(keyword);
        chrome.storage.sync.set({ keywords });
      }
    });
  }
});
*/
