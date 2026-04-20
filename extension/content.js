/**
 * News Filter Extension v4.1.0
 * Bundled content script - combines all modules for Chrome compatibility
 * 
 * This is a working version that maintains modular code organization
 * while being compatible with Chrome's content script system
 */

// Guard clause to prevent double initialization
if (window.newsFilterExtensionLoaded) {
  console.log('[News Filter v4.9] Extension already loaded, skipping initialization');
  throw new Error('News Filter Extension already initialized');
}
window.newsFilterExtensionLoaded = true;

// ============================================================================
// REMOTE CONFIGURATION MANAGER (V4.9)
// ============================================================================

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

const configManager = new RemoteConfigManager({
  configUrl: 'https://raw.githubusercontent.com/shtunz-rgb/news-filter-config/main/config.json',
  cacheDuration: 24 * 60 * 60 * 1000,
  timeout: 5000
});

// ============================================================================
// LOGGER UTILITY
// ============================================================================

class Logger {
  constructor(debug = false) {
    this.debug = debug;
    this.prefix = '[News Filter v4.9]';
  }

  log(message) {
    if (this.debug) {
      console.log(`${this.prefix} ${message}`);
    }
  }

  warn(message) {
    console.warn(`${this.prefix} ${message}`);
  }

  error(message) {
    console.error(`${this.prefix} ${message}`);
  }

  info(message) {
    console.info(`${this.prefix} ${message}`);
  }
}

// ============================================================================
// DOM UTILITIES
// ============================================================================

function getElementText(element, maxLength = 500) {
  if (!element) return '';
  const text = element.textContent || '';
  return text.substring(0, maxLength).toLowerCase();
}

function findElements(selectors, context = document) {
  if (!selectors) return [];
  try {
    return context.querySelectorAll(selectors);
  } catch (e) {
    return [];
  }
}

function matchesSelectors(element, selectors) {
  if (!element || !selectors) return false;
  try {
    return element.matches(selectors);
  } catch (e) {
    return false;
  }
}

function extractURL(element) {
  if (!element) return null;
  const linkElement = element.tagName === 'A' ? element : element.querySelector('a[href]');
  if (linkElement && linkElement.href) {
    return linkElement.href;
  }
  return null;
}

// ============================================================================
// SITE STRATEGIES
// ============================================================================

const SITE_STRATEGIES = {
  'yahoo.com': {
    // Selectors that identify the main article body on a full-article page.
    // Any candidate card found INSIDE one of these containers is skipped.
    articleBodySelectors: [
      'article.caas-article',
      '.caas-body',
      '[data-component="article"]'
    ],
    articleSelectors: [
      '.ntk-lead',
      '.slotView',
      '.opinionsSlotItem',
      '.mainArea',
      'div.slotView',
      'li.js-stream-content',
      '.stream-item',
      '[data-test-locator="lead-item"]',
      '[data-test-locator="stream-item"]',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '.js-stream-item-title',
      '[class*="headline"]',
      '[class*="title"]',
      '[data-test-locator="lead-summary"]',
      '[data-test-locator="stream-item-summary"]'
    ],
    substitutionMode: 'replace',
    priority: 10,
    notes: 'Yahoo News with infinite scroll support'
  },

  'cnn.com': {
    articleBodySelectors: [
      '.article__content',
      '.article__body',
      '[data-zone="article-body"]',
      '.pg-rail-tall__body',
      '.layout__content-zone article',
      'article.pg-rail-tall__body'
    ],
    articleSelectors: [
      'li.card.container__item',
      'li[data-component-name="card"]',
      'div.card.container__item',
      'div[data-component-name="card"]',
      '.container__title',
      'div.container__title',
      'article',
      '.article',
      'span.container__headline-text',
      'div.container__headline',
      'div.container__body-text'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]',
      'span.container__headline-text'
    ],
    substitutionMode: 'replace',
    priority: 8,
    notes: 'CNN News with card-based layout'
  },

  'bbc.com': {
    articleBodySelectors: [
      '[data-component="text-block"]',
      'main#main-content article',
      '[data-testid="article-page-body"]',
      '.ssrcss-uf6wea-RichTextComponentWrapper'
    ],
    articleSelectors: [
      '[data-testid="dundee-card"]',
      '[data-testid="manchester-card"]',
      '[data-testid="chester-card"]',
      // V4.3: Removed wildcard [data-testid*="card"] - it matches grid containers like wyoming-card-grid
      'div[data-indexcard="true"]',
      'li[class*="ssrcss-rs7w2i-ListItem"]',
      'li[class*="ssrcss-1amy2cn-ListItem"]',
      'div[data-testid="promo"]',
      'li[data-testid="carousel-item"]',
      '.ssrcss-1t3sjik-Promo',
      '.ssrcss-ip38cr-PortraitPromoContainer',
      '.media-list__item',
      '.gs-c-promo'
      // V4.3: Only use exact card type matches to avoid matching grid containers
    ],
    headlineSelectors: [
      '[data-testid="card-headline"]',
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'replace',
    priority: 9,
    notes: 'BBC News with comprehensive article detection'
  },

  'bbc.co.uk': {
    articleBodySelectors: [
      '[data-component="text-block"]',
      'main#main-content article',
      '[data-testid="article-page-body"]',
      '.ssrcss-uf6wea-RichTextComponentWrapper'
    ],
    articleSelectors: [
      '[data-testid="dundee-card"]',
      '[data-testid="manchester-card"]',
      '[data-testid="chester-card"]',
      // V4.3: Removed wildcard [data-testid*="card"] - it matches grid containers like wyoming-card-grid
      'div[data-indexcard="true"]',
      'li[class*="ssrcss-rs7w2i-ListItem"]',
      'li[class*="ssrcss-1amy2cn-ListItem"]',
      'div[data-testid="promo"]',
      'li[data-testid="carousel-item"]',
      '.ssrcss-1t3sjik-Promo',
      '.ssrcss-ip38cr-PortraitPromoContainer',
      '.media-list__item',
      '.gs-c-promo'
      // V4.3: Only use exact card type matches to avoid matching grid containers
    ],
    headlineSelectors: [
      '[data-testid="card-headline"]',
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'replace',
    priority: 9,
    notes: 'BBC News UK'
  },

  'theguardian.com': {
    articleBodySelectors: [
      '.article-body-commercial-selector',
      '[data-gu-name="body"]',
      '.content__article-body'
    ],
    articleSelectors: [
      '.dcr-7ajvu9',
      '.dcr-12lqghr',
      'li[data-link-name*="sublinks"]',
      'div[data-format-theme]',
      'div[data-format-design]',
      'li.dcr-1v3yego',
      'li.dcr-ixe7de',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'replace',
    priority: 8,
    notes: 'The Guardian with DCR card support'
  },

  'nytimes.com': {
    articleBodySelectors: [
      'section[name="articleBody"]',
      '[data-testid="article-body"]',
      '.article-body'
    ],
    articleSelectors: [
      '.story-wrapper',
      '.tpl-lb',
      '[data-tpl="sli"]',
      '[data-tpl="lb"]',
      '.css-1e505by',
      '.css-114aoa5',
      '.css-1cp3ece',
      '.css-1l4spti',
      '.css-1ez5fsm',
      '.css-1i8vfl5',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 8,
    notes: 'New York Times'
  },

  'reuters.com': {
    articleBodySelectors: [
      '[data-testid="article-body"]',
      '.article-body__content'
    ],
    articleSelectors: [
      '.media-story-card',
      '.story-card',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 7,
    notes: 'Reuters'
  },

  'apnews.com': {
    articleBodySelectors: [
      '.RichTextStoryBody',
      '.Article'
    ],
    articleSelectors: [
      '.FeedCard',
      '.CardHeadline',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 7,
    notes: 'AP News'
  },

  'wsj.com': {
    articleBodySelectors: [
      '.article-content',
      '[data-module="ArticleBody"]'
    ],
    articleSelectors: [
      '.WSJTheme--story--XB4V2mLz',
      '.article-wrap',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 7,
    notes: 'Wall Street Journal'
  },

  'cnbc.com': {
    articleBodySelectors: [
      '.ArticleBody-articleBody',
      '[data-module="ArticleBody"]'
    ],
    articleSelectors: [
      '.FeaturedCard-container',
      'div[id*="FeaturedCard"]',
      '.FeaturedCard-imageContainer',
      '.Card-standardBreakerCard',
      '.Card-card',
      '.RiverPlusCard-container',
      '.LatestNews-item',
      'li.LatestNews-item',
      '.SecondaryCard-container',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 7,
    notes: 'CNBC'
  },

  'politico.com': {
    articleBodySelectors: [
      '.story-text',
      '.article__content'
    ],
    articleSelectors: [
      'section.media-item',
      '.media-item',
      'section.media-item.top',
      'div.module.single-column-list section.media-item',
      'div.module.has-bottom-divider section.media-item',
      '.story-frag',
      '.headline',
      '.module.has-bottom-divider',
      'div.module.single-column-list',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 7,
    notes: 'Politico'
  },

  'foxnews.com': {
    articleBodySelectors: [
      '.article-body',
      '[data-v-app] .article-content'
    ],
    articleSelectors: [
      '.big-top',
      'article.story-1',
      'article.story-2',
      'article.story-3',
      'div.m',
      'div.video-stream',
      'div.info-header',
      'div.title',
      'div.related',
      'li.related-item',
      'div.info',
      'div.article',
      'div.story',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 7,
    notes: 'Fox News'
  },

  'washingtonpost.com': {
    articleBodySelectors: [
      '[data-qa="article-body"]',
      '.article-body'
    ],
    articleSelectors: [
      'li.wpds-c-iPlnLe',
      'li[data-link-detail]',
      'li[class*="wpds-c-"]',
      'ul li a, ol li a',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 7,
    notes: 'Washington Post'
  },

  'bloomberg.com': {
    articleBodySelectors: [
      '.body-content',
      '[class*="ArticleBody"]'
    ],
    articleSelectors: [
      '.story-package-module__story',
      '.story-list-story',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 6,
    notes: 'Bloomberg'
  },

  'usatoday.com': {
    articleBodySelectors: [
      '.gnt_ar_b',
      '[data-c-t="article"]'
    ],
    articleSelectors: [
      '.gnt_m_be',
      '.gnt_m_flm',
      '.gnt_m_flm_a',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    priority: 6,
    notes: 'USA Today'
  },

  'ynet.co.il': {
    articleBodySelectors: [
      '.article-body',
      '#ArticleBodyComponent',
      '.art_body',
      '[class*="ArticleBody"]'
    ],
    // V6.0.6: Comprehensive ynet.co.il selectors targeting individual article cards
    // Primary target: slotView (individual article cards)
    // Excludes: Commercial/sponsored content (commertial class)
    // Supports: News Ticker (Mivzakim), Video/Gallery strips
    articleSelectors: [
      // PRIMARY: Individual article cards (slotView) - excludes commercial content
      'div.slotView:not(.commertial)',
      'div.slotView',
      
      // NEWS TICKER (Mivzakim): ul > li and div.mivzak structures
      'ul.mivzak > li',
      'div.mivzak > li',
      'div[class*="mivzak"] > li',
      'li[class*="mivzak"]',
      
      // VIDEO/GALLERY STRIPS: With proper overlay alignment
      'div.layoutItem.multi-article-1280-2:not(:has(> div.layoutItem)):not(.show-small-vp)',
      'div.layoutItem.multi-article-rows-1280:not(:has(> div.layoutItem)):not(.show-small-vp)',
      'div.layoutItem.multi-article-top-1280:not(:has(> div.layoutItem)):not(.show-small-vp)',
      'div.layoutItem.article-promo:not(:has(> div.layoutItem)):not(.show-small-vp)',
      'div.layoutItem.multi-article-images-1280-2:not(:has(> div.layoutItem)):not(.show-small-vp)',
      
      // FALLBACK: Other article types
      'div[class*="layoutItem"][class*="article"]:not(:has(> div.layoutItem))',
      'div[class*="layoutItem"][class*="multi"]:not(:has(> div.layoutItem))',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]',
      'span[data-tb-title]',
      'a[href]'
    ],
    substitutionMode: 'overlay',
    priority: 9,
    notes: 'Ynet.co.il Hebrew news site - V6.0.6: slotView primary, News Ticker support, commercial exclusion'
  },

  'default': {
    articleBodySelectors: [],
    articleSelectors: [
      'article',
      '.article',
      '[role="article"]',
      '.news-item',
      '.story',
      '.post',
      '.item',
      'div[class*="article"]',
      'div[class*="story"]'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]',
      '[role="heading"]',
      'a[href]'
    ],
    substitutionMode: 'overlay',
    priority: 1,
    notes: 'Default fallback'
  }
};

function getSiteConfig(hostname) {
  for (const [domain, config] of Object.entries(SITE_STRATEGIES)) {
    if (domain !== 'default' && hostname.includes(domain)) {
      return { ...config, domain };
    }
  }
  return { ...SITE_STRATEGIES.default, domain: 'default' };
}

/**
 * V8.0.5: Returns true if `element` is nested inside the main article body
 * of a full-article page (as opposed to being a reference card alongside it).
 * Uses the `articleBodySelectors` defined per site in SITE_STRATEGIES.
 * When true the caller should skip processing that element entirely.
 */
function isInsideArticleBody(element, siteConfig) {
  const bodySelectors = (siteConfig && siteConfig.articleBodySelectors) || [];
  if (!bodySelectors.length) return false;

  // Build a single combined selector for efficiency
  const combined = bodySelectors.join(', ');
  try {
    // Walk up the DOM and check whether any ancestor matches the article-body selector
    let node = element.parentElement;
    while (node && node !== document.documentElement) {
      if (node.matches && node.matches(combined)) {
        return true;
      }
      node = node.parentElement;
    }
  } catch (e) {
    // Malformed selector — fail open (don't skip)
  }
  return false;
}

// ============================================================================
// SELECTOR ENGINE
// ============================================================================

class SelectorEngine {
  constructor(siteConfig, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.compiledSelectors = null;
    this.headlineSelectors = null;
    this.compile();
  }

  compile() {
    if (this.siteConfig.articleSelectors && this.siteConfig.articleSelectors.length > 0) {
      this.compiledSelectors = this.siteConfig.articleSelectors.join(', ');
    } else {
      this.compiledSelectors = 'article, .article, [role="article"]';
    }

    if (this.siteConfig.headlineSelectors && this.siteConfig.headlineSelectors.length > 0) {
      this.headlineSelectors = this.siteConfig.headlineSelectors.join(', ');
    } else {
      this.headlineSelectors = 'h1, h2, h3, h4, [class*="headline"]';
    }

    this.logger.log(`Compiled ${this.siteConfig.articleSelectors.length} article selectors`);
    this.logger.log(`Compiled ${this.siteConfig.headlineSelectors.length} headline selectors`);
  }

  getCompiledSelectors() {
    return this.compiledSelectors;
  }

  getHeadlineSelectors() {
    return this.headlineSelectors;
  }

  getSiteConfig() {
    return this.siteConfig;
  }

  getDomain() {
    return this.siteConfig.domain || 'unknown';
  }

  getSubstitutionMode() {
    return this.siteConfig.substitutionMode || 'overlay';
  }
}

// ============================================================================
// FILTER CORE
// ============================================================================

class FilterCore {
  constructor(keywords = [], options = {}) {
    this.keywords = keywords;
    this.options = options;
    this.logger = new Logger(options.debug);
  }

  shouldFilter(element) {
    if (!this.keywords.length) return false;
    if (!element) return false;

    const allContent = this.getElementKeywordContent(element);
    
    for (const keyword of this.keywords) {
      if (!keyword.trim()) continue;

      const keywordLower = keyword.toLowerCase().trim();
      const isNonASCII = /[^\x00-\x7F]/.test(keywordLower);

      const url = extractURL(element);
      if (url && this.matchesKeywordInURL(url, keywordLower, isNonASCII)) {
        this.logger.log(`Keyword match in URL: "${keyword}"`);
        return keyword;
      }

      if (this.matchesKeywordInContent(allContent, keywordLower, isNonASCII)) {
        this.logger.log(`Keyword match in content: "${keyword}"`);
        return keyword;
      }
    }

    return false;
  }

  getElementKeywordContent(element) {
    if (!element) return '';
    
    let content = '';

    const headline = element.querySelector('h1, h2, h3, h4, [class*="headline"], [class*="title"]');
    if (headline) {
      content += headline.textContent + ' ';
    }

    const summary = element.querySelector('[class*="summary"], [class*="description"], p');
    if (summary) {
      content += summary.textContent + ' ';
    }

    const elementText = element.textContent;
    if (elementText) {
      content += elementText.substring(0, 500);
    }

    return content.toLowerCase();
  }

  matchesKeywordInURL(url, keywordLower, isNonASCII) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      if (isNonASCII) {
        return pathname.includes(keywordLower);
      } else {
        const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
        return regex.test(pathname);
      }
    } catch (e) {
      return false;
    }
  }

  matchesKeywordInContent(content, keywordLower, isNonASCII) {
    if (!content) return false;

    if (isNonASCII) {
      return content.includes(keywordLower);
    } else {
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
      return regex.test(content);
    }
  }

  setKeywords(keywords) {
    this.keywords = keywords || [];
    this.logger.log(`Keywords set: ${this.keywords.join(', ')}`);
  }

  getKeywords() {
    return [...this.keywords];
  }
}

// ============================================================================
// ARTICLE DETECTOR
// ============================================================================

class ArticleDetector {
  constructor(selectorEngine, options = {}) {
    this.selectorEngine = selectorEngine;
    this.logger = new Logger(options.debug);
    this.processedElements = new WeakSet();
  }

  findArticles(doc = document) {
    const selectors = this.selectorEngine.getCompiledSelectors();
    
    try {
      const articles = findElements(selectors, doc);
      this.logger.log(`Found ${articles.length} articles`);
      return articles;
    } catch (error) {
      this.logger.error(`Error finding articles: ${error.message}`);
      return [];
    }
  }

  findHeadlines(doc = document) {
    const selectors = this.selectorEngine.getHeadlineSelectors();
    
    try {
      const headlines = findElements(selectors, doc);
      this.logger.log(`Found ${headlines.length} headlines`);
      return headlines;
    } catch (error) {
      this.logger.error(`Error finding headlines: ${error.message}`);
      return [];
    }
  }

  findArticlesInNode(node) {
    if (!node) return [];

    const articles = [];

    if (this.isArticleElement(node)) {
      articles.push(node);
    }

    const selectors = this.selectorEngine.getCompiledSelectors();
    try {
      const descendants = node.querySelectorAll(selectors);
      articles.push(...descendants);
    } catch (e) {
      this.logger.error(`Error finding articles in node: ${e.message}`);
    }

    return articles;
  }

  isArticleElement(node) {
    if (!node) return false;
    const selectors = this.selectorEngine.getCompiledSelectors();
    return matchesSelectors(node, selectors);
  }

  markAsProcessed(element) {
    if (element) {
      this.processedElements.add(element);
    }
  }

  isProcessed(element) {
    if (!element) return false;
    return this.processedElements.has(element);
  }
}

// ============================================================================
// DOM MANIPULATOR
// ============================================================================

class DOMManipulator {
  constructor(options = {}) {
    this.logger = new Logger(options.debug);
  }

  applyOverlay(element, keyword) {
    if (!element) return false;

    try {
      if (element.hasAttribute('data-news-filtered')) {
        this.logger.log(`Element already has overlay for keyword: ${element.getAttribute('data-news-filtered')}`);
        return false;
      }
      
      // V6.0.10 FIX: Check if element already has a news-filter-overlay child
      // This prevents duplicate overlays on the same element
      if (element.querySelector('.news-filter-overlay')) {
        this.logger.log(`Element already has news-filter-overlay child`);
        return false;
      }
      
      // V6.0.11 FIX: Size-based prevention for large containers
      // Prevent overlays on containers larger than 300×200px (typical slotView size is ~200×113px)
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // If element is significantly larger than a typical article card, skip it
      // slotView cards are ~200×113px, containers are ~610×497px
      if (width > 300 || height > 200) {
        // Check if this is a container with multiple children (slotView elements)
        const slotViews = element.querySelectorAll('.slotView');
        if (slotViews.length > 1) {
          this.logger.log(`Skipping large container (${Math.round(width)}×${Math.round(height)}px) with ${slotViews.length} articles`);
          return false;  // Don't apply overlay to containers
        }
      }

      // v7.3.8: In-place approach - keep the article element exactly where it is in the DOM
      // so CSS Grid/Flexbox layouts are never disturbed.
      //
      // Strategy:
      //   1. Set position:relative on the article element itself (it stays in the grid)
      //   2. Wrap ALL of its existing children in a single blur container div
      //   3. Add white overlay inside the blur container
      //   4. Add the label as a direct child of the article (position:absolute, NOT blurred)
      //
      // The label is a sibling of the blur container inside the article, so:
      //   - It is anchored to the article's top-left corner (position:relative parent)
      //   - It is NOT inside the blur container, so it stays sharp
      //   - The article element never moves in the DOM, so grid/flex layouts are intact

      element.setAttribute('data-news-filtered', keyword);

      // Step 1: Make the article itself the positioning context
      // Preserve any existing position value (e.g. 'relative' already set by CNN)
      const existingPosition = window.getComputedStyle(element).position;
      if (existingPosition === 'static') {
        element.style.position = 'relative';
        element.setAttribute('data-skeep-added-position', '1');
      }

      // Step 2: Collect all existing children of the article
      const existingChildren = Array.from(element.childNodes);

      // Step 3: Create blur container and move all existing children into it
      const blurContainer = document.createElement('div');
      blurContainer.className = 'news-filter-blur-container';
      blurContainer.style.cssText = `
        filter: blur(5px);
        width: 100%;
        height: 100%;
        position: relative;
      `;
      existingChildren.forEach(child => blurContainer.appendChild(child));
      element.appendChild(blurContainer);

      // Step 4: Add white overlay (20% opacity) inside blur container
      const whiteOverlay = document.createElement('div');
      whiteOverlay.className = 'news-filter-white-overlay';
      whiteOverlay.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(255, 255, 255, 0.2);
        z-index: 1;
        pointer-events: none;
      `;
      blurContainer.appendChild(whiteOverlay);

      // Step 5: Add label as a direct child of the article (sibling of blur container)
      // It is NOT inside blurContainer, so it is not affected by blur.
      // It IS inside the article (position:relative), so it is always anchored to
      // the article's top-left corner regardless of page layout shifts.
      const label = document.createElement('div');
      label.className = 'news-filter-label';
      label.textContent = `Filter: ${keyword}`;
      label.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        background: white;
        color: #6366F1;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: bold;
        z-index: 99999;
        font-family: Arial, sans-serif;
        font-size: 13px;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        white-space: nowrap;
      `;
      element.appendChild(label);

      this.logger.log(`Applied in-place blur overlay for keyword: ${keyword}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to apply overlay: ${error.message}`);
      return false;
    }
  }

  clearAllOverlays() {
    try {
      // v7.3.8: Restore in-place blur - move children back from blur container to article
      const filteredElements = document.querySelectorAll('[data-news-filtered]');
      let count = 0;

      filteredElements.forEach((element) => {
        // Remove the label (direct child of article, not inside blur container)
        const label = element.querySelector(':scope > .news-filter-label');
        if (label) label.remove();

        // Find the blur container (direct child of article)
        const blurContainer = element.querySelector(':scope > .news-filter-blur-container');
        if (blurContainer) {
          // Move all children (except the white overlay) back to the article
          const children = Array.from(blurContainer.childNodes).filter(
            child => !child.classList || !child.classList.contains('news-filter-white-overlay')
          );
          children.forEach(child => element.insertBefore(child, blurContainer));
          // Remove the now-empty blur container
          blurContainer.remove();
        }

        // Restore position style if we added it
        if (element.hasAttribute('data-skeep-added-position')) {
          element.style.position = '';
          element.removeAttribute('data-skeep-added-position');
        }

        element.removeAttribute('data-news-filtered');
        count++;
      });

      // Also clean up any leftover body-appended labels from older versions
      document.querySelectorAll('.news-filter-label').forEach(el => el.remove());

      this.logger.log(`Cleared ${count} in-place blur overlays`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to clear overlays: ${error.message}`);
      return 0;
    }
  }

  getFilteredCount() {
    try {
      return document.querySelectorAll('[data-news-filtered]').length;
    } catch (error) {
      this.logger.error(`Failed to get filtered count: ${error.message}`);
      return 0;
    }
  }

  // V7.3.0: Loading overlay with spinner and timer for substitution
  // v7.2.2 fix: Make overlay a body sibling with fixed positioning to survive innerHTML replacement
  applyLoadingOverlay(element, keyword, section = 'loading...') {
    if (!element) return null;

    try {
      // Generate unique ID for this element
      if (!element.id) {
        element.id = `skeep-article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Remove any existing overlays for this element
      const existingOverlay = document.querySelector(`.skeep-loading-overlay[data-target-element-id="${element.id}"]`);
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Get element position for fixed positioning
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      const overlay = document.createElement('div');
      overlay.className = 'skeep-loading-overlay';
      overlay.setAttribute('data-start-time', Date.now());
      overlay.setAttribute('data-target-element-id', element.id);
      overlay.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: rgba(255, 255, 255, 1) !important;
        border: 2px solid #808080 !important;
        z-index: 99999 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: Arial, sans-serif !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
      `;

      // Spinner animation (CSS keyframes)
      const style = document.createElement('style');
      style.textContent = `
        @keyframes skeep-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .skeep-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #e0e0e0;
          border-top: 3px solid #006A4E;
          border-radius: 50%;
          animation: skeep-spin 1s linear infinite;
          margin-bottom: 10px;
        }
      `;
      overlay.appendChild(style);

      // Spinner element
      const spinner = document.createElement('div');
      spinner.className = 'skeep-spinner';
      overlay.appendChild(spinner);

      // "Replacing article..." text
      const title = document.createElement('div');
      title.style.cssText = 'font-size: 14px; font-weight: bold; color: #333; margin-bottom: 8px;';
      title.textContent = 'Replacing article...';
      overlay.appendChild(title);

      // Filtered word
      const keywordText = document.createElement('div');
      keywordText.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 4px;';
      keywordText.textContent = `Filtered word: ${keyword}`;
      overlay.appendChild(keywordText);

      // Replacement section
      const sectionText = document.createElement('div');
      sectionText.className = 'skeep-loading-section';
      sectionText.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 8px;';
      sectionText.textContent = `Replacement from: ${section}`;
      overlay.appendChild(sectionText);

      // Timer display
      const timer = document.createElement('div');
      timer.className = 'skeep-loading-timer';
      timer.style.cssText = 'font-size: 14px; font-weight: bold; color: #006A4E;';
      timer.textContent = 'Time: 00:00';
      overlay.appendChild(timer);

      // Start timer interval
      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timer.textContent = `Time: ${minutes}:${seconds}`;
      }, 1000);

      // Store interval ID for cleanup
      overlay.setAttribute('data-timer-interval', timerInterval);

      // v7.2.2: Append to body instead of element (so innerHTML replacement doesn't destroy it)
      document.body.appendChild(overlay);
      
      // Force reflow to ensure overlay renders
      void overlay.offsetHeight;

      this.logger.log(`Applied loading overlay for keyword: ${keyword} (as body sibling)`);
      return overlay;
    } catch (error) {
      this.logger.error(`Failed to apply loading overlay: ${error.message}`);
      return null;
    }
  }

  // V7.3.0: Remove loading overlay and clean up timer
  // v7.2.2 fix: Find overlay by element ID since it's a body sibling
  removeLoadingOverlay(element) {
    if (!element) return false;

    try {
      const overlay = document.querySelector(`.skeep-loading-overlay[data-target-element-id="${element.id}"]`);
      if (overlay) {
        // Clear the timer interval
        const intervalId = overlay.getAttribute('data-timer-interval');
        if (intervalId) {
          clearInterval(parseInt(intervalId));
        }
        overlay.remove();
        this.logger.log('Removed loading overlay');
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to remove loading overlay: ${error.message}`);
      return false;
    }
  }

  // V7.3.0: Update loading overlay section text
  // v7.2.2 fix: Find overlay by element ID since it's a body sibling
  updateLoadingOverlaySection(element, section) {
    if (!element) return false;

    try {
      const overlay = document.querySelector(`.skeep-loading-overlay[data-target-element-id="${element.id}"]`);
      if (overlay) {
        const sectionText = overlay.querySelector('.skeep-loading-section');
        if (sectionText) {
          sectionText.textContent = `Replacement from: ${section}`;
          return true;
        }
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to update loading overlay: ${error.message}`);
      return false;
    }
  }
}

// ============================================================================
// STORAGE MANAGER
// ============================================================================

class StorageManager {
  constructor(options = {}) {
    this.logger = new Logger(options.debug);
    this.storageQueue = [];
    this.isProcessingQueue = false;
  }

  async loadKeywords() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['keywords'], (result) => {
        const keywords = result.keywords || [];
        this.logger.log(`Loaded ${keywords.length} keywords`);
        resolve(keywords);
      });
    });
  }

  async loadEnabledState() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['isEnabled'], (result) => {
        const isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
        this.logger.log(`Loaded enabled state: ${isEnabled}`);
        resolve(isEnabled);
      });
    });
  }

  async loadFilteredArticles() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['filteredArticles'], (result) => {
        const articles = result.filteredArticles || [];
        this.logger.log(`Loaded ${articles.length} filtered articles`);
        resolve(articles);
      });
    });
  }

  async saveFilteredArticles(articles) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ filteredArticles: articles }, () => {
        this.logger.log(`Saved ${articles.length} filtered articles`);
        resolve();
      });
    });
  }

  queueArticle(article) {
    this.storageQueue.push(article);
    this.logger.log(`Queued article: "${article.title}"`);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessingQueue || this.storageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const article = this.storageQueue.shift();

    try {
      const articles = await this.loadFilteredArticles();
      
      const exists = articles.some(a => a.url === article.url);
      if (!exists) {
        articles.push(article);
        await this.saveFilteredArticles(articles);
        this.logger.log(`Saved article: "${article.title}"`);
        
        // V6.0.3 FIX: Send article to popup for drawer display
        try {
          chrome.runtime.sendMessage({
            type: 'articleFiltered',
            article: article
          }).catch(() => {
            // Popup not open, that's okay
          });
        } catch (error) {
          this.logger.log(`Could not send article to popup: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing queue: ${error.message}`);
    }

    this.isProcessingQueue = false;

    if (this.storageQueue.length > 0) {
      this.processQueue();
    }
  }
}

// ============================================================================
// OPTIMIZED OBSERVER
// ============================================================================

class OptimizedObserver {
  constructor(filterEngine, options = {}) {
    this.filterEngine = filterEngine;
    this.logger = new Logger(options.debug);
    this.debounceDelay = 50;  // V4.6: Reduced to 100ms for faster infinite scroll detection
    this.observer = null;
    this.scanTimeout = null;
    this.lastScanTime = 0;
    this.minScanInterval = 50;  // V4.5: Minimum 50ms between scans
  }

  setup() {
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,  // V4.5: Don't watch attributes to reduce overhead
      characterData: false  // V4.5: Don't watch text changes to reduce overhead
    });

    this.logger.log('[News Filter v4.9] MutationObserver set up for infinite scroll');
    console.log('[DEBUG] MutationObserver successfully initialized on document.body');
  }

  handleMutations(mutations) {
    console.log('[DEBUG] MutationObserver fired with', mutations.length, 'mutations');
    const nodesToProcess = [];
    let hasSignificantChanges = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            nodesToProcess.push(node);
            // V4.6: Check if the node ITSELF is an article (using .matches())
            const isArticleNode = node.matches && node.matches('[class*="ntk"], [class*="stream-item"], [data-testid*="card"], [class*="card"]');
            // Also check if it contains articles
            const containsArticles = node.querySelectorAll && node.querySelectorAll('[class*="ntk"], [class*="stream-item"], [data-testid*="card"], [class*="card"]').length > 0;
            if (isArticleNode || containsArticles) {
              hasSignificantChanges = true;
            }
          }
        });
      }
    });

    if (nodesToProcess.length === 0) {
      return;
    }

    // V4.6: Process all significant changes immediately (removed minScanInterval check)

    console.log('[DEBUG] Processing', nodesToProcess.length, 'nodes'); this.logger.log(`[News Filter v4.9] Processing ${nodesToProcess.length} new nodes (significant: ${hasSignificantChanges})`);

    if (this.scanTimeout) clearTimeout(this.scanTimeout);
    this.scanTimeout = setTimeout(() => {
      this.lastScanTime = Date.now();
      this.filterEngine.scanAddedNodes(nodesToProcess);
    }, this.debounceDelay);
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    this.stopPeriodicScan();
    }
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
  }
}

// ============================================================================
// MESSAGING HANDLER
// ============================================================================

class MessagingHandler {
  constructor(filterEngine, options = {}) {
    this.filterEngine = filterEngine;
    this.logger = new Logger(options.debug);
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    this.logger.log('Message listeners set up');
  }

  handleMessage(message, sender, sendResponse) {
    this.logger.log(`Received message: ${message.action}`);

    switch (message.action) {
      case 'updateKeywords':
        this.handleUpdateKeywords(message, sendResponse);
        break;

      case 'toggleEnabled':
        this.handleToggleEnabled(message, sendResponse);
        break;

      case 'toggleSubstitution':
        this.handleToggleSubstitution(message, sendResponse);
        break;

      case 'getStatus':
        this.handleGetStatus(message, sendResponse);
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  handleUpdateKeywords(message, sendResponse) {
    try {
      const keywords = message.keywords || [];
      this.filterEngine.setKeywords(keywords);
      this.filterEngine.scanAndFilter();
      
      this.logger.log(`Keywords updated: ${keywords.join(', ')}`);
      sendResponse({ success: true, count: keywords.length });
    } catch (error) {
      this.logger.error(`Error updating keywords: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleToggleEnabled(message, sendResponse) {
    try {
      const isEnabled = message.isEnabled !== false;
      this.filterEngine.setEnabled(isEnabled);

      if (isEnabled) {
        this.filterEngine.scanAndFilter();
      } else {
        this.filterEngine.clearAllOverlays();
      }

      this.logger.log(`Filtering ${isEnabled ? 'enabled' : 'disabled'}`);
      sendResponse({ success: true, isEnabled });
    } catch (error) {
      this.logger.error(`Error toggling: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleToggleSubstitution(message, sendResponse) {
    try {
      const substitutionEnabled = message.substitutionEnabled !== false;
      this.filterEngine.setSubstitutionEnabled(substitutionEnabled);

      this.logger.log(`Substitution mode ${substitutionEnabled ? 'enabled' : 'disabled'}`);
      sendResponse({ success: true, substitutionEnabled });
    } catch (error) {
      this.logger.error(`Error toggling substitution: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleGetStatus(message, sendResponse) {
    try {
      const status = {
        isEnabled: this.filterEngine.isEnabled,
        keywordsCount: this.filterEngine.keywords.length,
        filteredCount: this.filterEngine.filteredCount,
        domain: this.filterEngine.selectorEngine.getDomain()
      };

      this.logger.log(`Status: ${JSON.stringify(status)}`);
      sendResponse({ success: true, ...status });
    } catch (error) {
      this.logger.error(`Error getting status: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  sendToPopup(message) {
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup not open, ignore
    });
  }
}

// ============================================================================
// MAIN EXTENSION CLASS
// ============================================================================

class NewsFilterExtension {
  constructor() {
    this.logger = new Logger(false);
    this.keywords = [];
    this.isEnabled = true;
    this.filteredCount = 0;
    this.siteConfig = null;
    this.selectorEngine = null;
    this.filterCore = null;
    this.detector = null;
    this.observer = null;
    this.domManipulator = null;
    this.storageManager = null;
    this.messagingHandler = null;
    
    // V7.0.0: Substitution components
    this.contentPoolManager = null;
    this.articleMatcher = null;
    this.substitutionEnabled = true; // Default: enabled
    
    this.logger.info('Initializing News Filter Extension v7.0.0');
    this.init();
  }


  /**
   * Get site configuration from remote config
   */
  getSiteConfigFromRemote(hostname) {
    if (!this.remoteConfig || !this.remoteConfig.sites) {
      return null;
    }
    
    // Find matching site in remote config
    for (const [domain, config] of Object.entries(this.remoteConfig.sites)) {
      if (hostname.includes(domain) && config.enabled) {
        this.logger.log('Using remote config for site:', domain);
        return config;
      }
    }
    
    // Fall back to default config
    if (this.remoteConfig.fallback) {
      this.logger.log('Using fallback config for hostname:', hostname);
      return this.remoteConfig.fallback;
    }
    
    return null;
  }

  async init() {
    try {
      const hostname = window.location.hostname;
      this.siteConfig = getSiteConfig(hostname);
      this.logger.log(`Using config for: ${hostname}`);

      this.selectorEngine = new SelectorEngine(this.siteConfig, { debug: false });
      this.filterCore = new FilterCore(this.keywords, { debug: false });
      this.detector = new ArticleDetector(this.selectorEngine, { debug: false });
      this.observer = new OptimizedObserver(this, { debug: false });
      this.domManipulator = new DOMManipulator({ debug: false });
      this.storageManager = new StorageManager({ debug: false });
      this.messagingHandler = new MessagingHandler(this, { debug: false });
      
      // V7.0.0: Initialize substitution components
      if (window.ContentPoolManager && window.ArticleMatcher) {
        this.contentPoolManager = new window.ContentPoolManager();
        this.articleMatcher = new window.ArticleMatcher();
        this.logger.log('Substitution engine initialized');
      } else {
        this.logger.warn('Substitution components not loaded, using overlay mode only');
      }

      // V7.1.1: Initialize IntersectionObserver for viewport-based substitution
      this.pendingSubstitutions = new Map(); // Store articles waiting for viewport entry
      this.setupViewportObserver();

      await this.loadSettings();

      // V7.1.4: Proactively build content pool on page load
      if (this.contentPoolManager && this.keywords.length > 0) {
        const site = this.getSiteIdentifier();
        if (site) {
          this.logger.log(`[ProactivePooling] Starting pool build for ${site}`);
          // Start building pool in background (don't await - let it run in parallel)
          this.contentPoolManager.getPool(site).then(() => {
            this.logger.log(`[ProactivePooling] Pool ready for ${site}`);
          }).catch(err => {
            this.logger.warn(`[ProactivePooling] Pool build failed: ${err.message}`);
          });
        }
      }

      this.scanAndFilter();

      this.observer.setup();
    this.startPeriodicScan(1000);  // V4.8: Aggressive scan every 1 second for missed articles

      this.messagingHandler.setupListeners();

      this.logger.info('Initialization complete');
    } catch (error) {
      this.logger.error(`Initialization failed: ${error.message}`);
    }
  }

  async loadSettings() {
    try {
      this.keywords = await this.storageManager.loadKeywords();
      this.isEnabled = await this.storageManager.loadEnabledState();
      this.filterCore.setKeywords(this.keywords);
      this.logger.log(`Loaded ${this.keywords.length} keywords, enabled: ${this.isEnabled}`);
    } catch (error) {
      this.logger.error(`Failed to load settings: ${error.message}`);
    }
  }

  // V7.1.1: Setup IntersectionObserver for viewport-based substitution
  setupViewportObserver() {
    const options = {
      root: null, // viewport
      rootMargin: '50px', // Start loading 50px before article enters viewport
      threshold: 0.1 // Trigger when 10% of article is visible
    };

    this.viewportObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const pendingData = this.pendingSubstitutions.get(element);
          
          if (pendingData) {
            this.logger.log('[ViewportObserver] Article entered viewport, starting substitution');
            // Remove from pending
            this.pendingSubstitutions.delete(element);
            // Stop observing
            this.viewportObserver.unobserve(element);
            // Start substitution with loading overlay
            this.performSubstitution(element, pendingData.keyword);
          }
        }
      });
    }, options);

    this.logger.log('[ViewportObserver] IntersectionObserver initialized');
  }

  // V7.1.1: Perform substitution with loading overlay (called when article enters viewport)
  async performSubstitution(element, keyword) {
    const startTime = Date.now();
    const MIN_LOADING_TIME = 3000; // V7.1.5: Minimum 3 seconds loading overlay display
    
    try {
      // Show loading overlay
      this.domManipulator.applyLoadingOverlay(element, keyword, 'searching...');
      
      // V7.1.5: If pool is building, wait for it and show appropriate message
      if (this.contentPoolManager && this.contentPoolManager.buildPromise) {
        this.logger.log('[PerformSubstitution] Waiting for content pool to build...');
        await this.contentPoolManager.buildPromise;
        this.logger.log('[PerformSubstitution] Pool ready, proceeding with substitution');
      }
      
      // Try substitution
      const substituted = await this.trySubstitution(element, keyword);
      
      // V7.1.5: Enforce minimum loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        const remainingTime = MIN_LOADING_TIME - elapsed;
        this.logger.log(`[PerformSubstitution] Waiting ${remainingTime}ms to meet minimum loading time`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      if (substituted) {
        // Remove loading overlay - substitution handles final styling
        this.domManipulator.removeLoadingOverlay(element);
        this.logger.log(`Article substituted with ${substituted.section} content`);
        this.trackFilteredArticle(element, keyword);
      } else {
        // Substitution failed - remove loading overlay and apply red overlay
        this.domManipulator.removeLoadingOverlay(element);
        this.logger.log('Substitution failed, falling back to overlay');
        this.domManipulator.applyOverlay(element, keyword);
        this.trackFilteredArticle(element, keyword);
      }
    } catch (error) {
      this.logger.error(`Failed to perform substitution: ${error.message}`);
      // V7.1.5: Still enforce minimum time even on error
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }
      // Clean up and fall back to red overlay
      this.domManipulator.removeLoadingOverlay(element);
      this.domManipulator.applyOverlay(element, keyword);
      this.trackFilteredArticle(element, keyword);
    }
  }

  scanAndFilter() {
    if (!this.isEnabled || this.keywords.length === 0) {
      this.logger.log('Filtering disabled or no keywords set');
      return;
    }

    this.logger.log(`Scanning with keywords: ${this.keywords.join(', ')}`);

    const articles = this.detector.findArticles(document);
    const headlines = this.detector.findHeadlines(document);

    this.logger.log(`Found ${articles.length} articles and ${headlines.length} headlines`);

    let filteredCount = 0;
    const allElements = [...articles, ...headlines];
    const processedContainers = new Set();

    allElements.forEach(element => {
      if (!this.detector.isProcessed(element)) {
        const matchedKeyword = this.filterCore.shouldFilter(element);
        if (matchedKeyword) {
          // Find the proper article container
          const articleContainer = this.findProperArticleContainer(element);
          
          // Only apply filter if we haven't already processed this container
          if (!processedContainers.has(articleContainer)) {
            this.applyFilter(articleContainer, matchedKeyword);
            filteredCount++;
            processedContainers.add(articleContainer);
          }
        }
        this.detector.markAsProcessed(element);
      }
    });

    this.filteredCount = filteredCount;
    this.updatePopupCount();
    this.logger.log(`Filtered ${filteredCount} articles`);
  }

  findProperArticleContainer(element) {
    // V6.0.9 FIX: For slotView elements on ynet, return immediately without traversing up
    // This ensures the overlay is applied to the individual card, not the container
    const className = element.className || '';
    if (className.includes('slotView')) {
      return element;  // Return the slotView card immediately
    }

    // V8.0.9 FIX: CNN container_lead-package — container__title handling
    // The container__title div is the large bold headline that sits ABOVE the <li> card
    // in a container_lead-package layout. Both point to the same article.
    // Strategy: when container__title is encountered, find the first <li> card INSIDE
    // the same outer wrapper and return that <li> as the container. This ensures
    // substituteWithImage() receives a proper CNN card element (with a.container__link,
    // img, etc.) rather than the outer wrapper div which has none of those.
    // The <li> card itself will be skipped by processedContainers deduplication.
    if (className.includes('container__title')) {
      // Walk up to find the outer container_lead-package wrapper
      let node = element.parentElement;
      let d = 0;
      while (node && node !== document.body && d < 8) {
        const nc = node.className || '';
        if (nc.includes('container_lead-package') && !nc.includes('container_lead-package__')) {
          // Found the outer wrapper — now find the first <li> card inside it
          const liCard = node.querySelector('li.card.container__item');
          if (liCard) return liCard;  // Return the actual card element
          break;
        }
        node = node.parentElement;
        d++;
      }
      // Fallback: return element itself if no card found
    }
    
    // V6.4.7 FIX: For opinionsSlotItem on ynet, traverse up to find the full container
    // This ensures the overlay covers both text AND image
    if (className.includes('slotText') || className.includes('author') || className.includes('title') || className.includes('subTitle')) {
      let parent = element.parentElement;
      let depth = 0;
      while (parent && parent !== document.body && depth < 5) {
        const parentClass = parent.className || '';
        if (parentClass.includes('opinionsSlotItem')) {
          return parent;  // Found the full article container with image
        }
        parent = parent.parentElement;
        depth++;
      }
    }
    
    // Start with the element itself
    let current = element;
    let bestMatch = element;
    const maxTraversalDepth = 10;  // Increased depth for deeply nested structures
    let depth = 0;
    
    // Try to find a proper article container by traversing up the DOM
    while (current && current !== document.body && depth < maxTraversalDepth) {
      const className = current.className || '';
      const tagName = current.tagName ? current.tagName.toLowerCase() : '';
      const dataTestId = current.getAttribute ? (current.getAttribute('data-testid') || '') : '';
      
      // V4.2 FIX: Check for Yahoo's ntk-item container FIRST (highest priority)
      // This must come before isArticleElement check to avoid matching h3 first
      if (className.includes('ntk-item') && tagName === 'li') {
        return current;  // Found Yahoo article container - return immediately
      }
      
      // Check for CNN's card container (standard + lead-package cards)
      if (className.includes('card') && className.includes('container__item') && tagName === 'li') {
        return current;  // Found CNN article container
      }
      
      // V4.2 FIX: Check for BBC card containers (dundee-card, manchester-card, chester-card, etc.)
      if (dataTestId && dataTestId.includes('card') && dataTestId !== 'card-headline') {
        return current;  // Found BBC article card container
      }
      
      // Check if current element matches article selectors
      if (this.detector.isArticleElement(current)) {
        bestMatch = current;
        
        // Check if parent is a stream wrapper (contains multiple articles)
        if (current.parentElement && this.isStreamWrapper(current.parentElement)) {
          // Stop here - don't traverse to the stream wrapper
          return current;
        }
      }
      
      current = current.parentElement;
      depth++;
    }
    
    // Return the best match found
    return bestMatch;
  }

  isStreamWrapper(element) {
    if (!element) return false;
    
    const className = element.className || '';
    const tagName = element.tagName ? element.tagName.toLowerCase() : '';
    
    // V4.1 FIX: CNN-specific patterns with correct naming conventions
    const streamWrapperPatterns = [
      // V6.0.7 FIX: Ynet.co.il patterns
      'multi-strip-lines',      // Ynet multi-article strip container
      'YnetMultiStripRowsComponenta',  // Ynet strip layout wrapper
      'mivzak',                 // Ynet news ticker
      // CNN patterns (with double underscores)
      'container_lead-plus-headlines__cards-wrapper',
      'container_lead-plus-headlines-with-images__cards-wrapper',
      'container__field-links',
      'container_lead-plus-headlines__field-links',
      // Generic patterns
      'cards-wrapper',
      '__cards-wrapper',
      '__field-links',
      'field-links',
      'stream',
      'feed',
      'list',
      'grid',
      'carousel',
      'timeline',
      'collection'
    ];
    
    for (const pattern of streamWrapperPatterns) {
      if (className.includes(pattern)) {
        const articleElements = element.querySelectorAll('li.card.container__item, div.card.container__item, li.card, div.card, article, .article');
        // If a container looks like a wrapper and holds even 1 article, treat it as a wrapper
        if (articleElements.length > 0) {
          return true;
        }
      }
    }
    
    // Check for generic lists (UL/DIV) that contain cards
    if ((tagName === 'ul' || tagName === 'div') && (className.includes('card') || className.includes('container'))) {
      const cardElements = element.querySelectorAll('li.card, div.card, .container__item');
      if (cardElements.length > 0) {
        return true;
      }
    }
    
    return false;
  }


  // V4.7: Periodic scan to catch articles missed by MutationObserver
  startPeriodicScan(interval = 1000) {
    if (this.periodicScanInterval) {
      clearInterval(this.periodicScanInterval);
    }
    
    this.periodicScanInterval = setInterval(() => {
      if (!this.isEnabled || this.keywords.length === 0) {
        return;
      }
      
      // V7.1.3 FIX: Check pending substitutions and substitute if now in viewport
      this.pendingSubstitutions.forEach((data, element) => {
        const rect = element.getBoundingClientRect();
        const isInViewport = (
          rect.top >= -50 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        if (isInViewport) {
          console.log('[PeriodicScan] Pending article now in viewport, substituting');
          this.pendingSubstitutions.delete(element);
          this.viewportObserver.unobserve(element);
          this.performSubstitution(element, data.keyword);
        }
      });
      
      const allArticles = this.detector.findArticles();
      let filteredCount = 0;
      const processedContainers = new Set();
      
      allArticles.forEach(article => {
        // V7.0.9 FIX: Skip already substituted articles early
        if (article.classList && article.classList.contains('skeep-substituted')) {
          return; // Already substituted, skip entirely
        }
        
        // V4.8: More aggressive - check if article has overlay, not just isProcessed
        const hasOverlay = article.querySelector('.news-filter-overlay');
        // V7.1.6 FIX #2 & #3: Also check for loading overlay and skeep-substituted class
        const hasLoadingOverlay = article.querySelector('.skeep-loading-overlay');
        const isSubstituted = article.classList && article.classList.contains('skeep-substituted');
        if (!hasOverlay && !hasLoadingOverlay && !isSubstituted) {
          const matchedKeyword = this.filterCore.shouldFilter(article);
          if (matchedKeyword) {
            const articleContainer = this.findProperArticleContainer(article);
            if (!processedContainers.has(articleContainer)) {
              this.applyFilter(articleContainer, matchedKeyword);
              filteredCount++;
              processedContainers.add(articleContainer);
            }
          }
        }
      });
      
      if (filteredCount > 0) {
        console.log('[DEBUG] Periodic scan found and filtered', filteredCount, 'articles');
      }
    }, interval);
  }

  stopPeriodicScan() {
    if (this.periodicScanInterval) {
      clearInterval(this.periodicScanInterval);
      this.periodicScanInterval = null;
    }
  }

  scanAddedNodes(nodes) {
    if (!this.isEnabled || this.keywords.length === 0) {
      return;
    }

    this.logger.log(`[News Filter v4.9] Scanning ${nodes.length} newly added nodes`);

    let filteredCount = 0;
    const processedContainers = new Set();

    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // V4.6: Check if the node ITSELF is an article
        const isSelfArticle = this.detector.isArticleElement(node);
        // V4.6: Check if the node CONTAINS articles
        const childArticles = this.detector.findArticlesInNode(node);
        const articles = isSelfArticle ? [node, ...childArticles] : childArticles;
        
        articles.forEach(article => {
          // V7.0.9 FIX: Skip already substituted articles early to prevent detection loop
          if (article.classList && article.classList.contains('skeep-substituted')) {
            return; // Already substituted, skip entirely
          }
          
          if (!this.detector.isProcessed(article)) {
            // V7.1.6 FIX: Also check for loading overlay and substituted class on article container
            const articleContainer = this.findProperArticleContainer(article);
            const containerHasLoadingOverlay = articleContainer.querySelector('.skeep-loading-overlay');
            const containerHasOverlay = articleContainer.querySelector('.news-filter-overlay');
            const containerIsSubstituted = articleContainer.classList && articleContainer.classList.contains('skeep-substituted');
            
            if (containerHasLoadingOverlay || containerHasOverlay || containerIsSubstituted) {
              this.detector.markAsProcessed(article);
              return; // Already being processed or processed
            }
            
            const matchedKeyword = this.filterCore.shouldFilter(article);
            if (matchedKeyword) {
              // Only apply filter if we haven't already processed this container
              if (!processedContainers.has(articleContainer)) {
                this.applyFilter(articleContainer, matchedKeyword);
                filteredCount++;
                processedContainers.add(articleContainer);
                // V7.0.4 FIX: Mark container as processed to prevent infinite loop after substitution
                this.detector.markAsProcessed(articleContainer);
              }
            }
            this.detector.markAsProcessed(article);
          }
        });
      }
    });

    if (filteredCount > 0) {
      this.filteredCount += filteredCount;
      this.updatePopupCount();
      this.logger.log(`Filtered ${filteredCount} articles from new nodes`);
    }
  }

  async applyFilter(element, keyword) {
    try {
      // V4.1 FIX: Don't apply overlay to wrapper/container elements
      // Only apply to actual article elements
      if (this.isStreamWrapper(element)) {
        this.logger.log('Skipping overlay on stream wrapper element');
        return;
      }

      // V8.0.5: Skip elements that are inside the main article body of a full-article page.
      // This lets users read an article uninterrupted even if it mentions a filtered keyword,
      // while still processing reference cards that appear alongside the article.
      if (isInsideArticleBody(element, this.siteConfig)) {
        this.logger.log('[v8.0.5] Skipping element inside article body (full-article page guard)');
        return;
      }
      
      // V8.0.0: Hybrid approach - check for images
      const hasImage = element.querySelector('img, picture, video');
      
      if (hasImage) {
        // V8.0.0: Articles WITH images: DB-backed substitution (image + title + URL)
        this.logger.log('[Filter v8.0.0] Article has image - performing DB substitution for keyword: ' + keyword);
        await this.performDBSubstitution(element, keyword);
      } else {
        // Articles WITHOUT images: Instant substitution via live-scrape pool (unchanged)
        this.logger.log('[Filter v8.0.0] Article has NO image - performing instant substitution for keyword: ' + keyword);
        await this.performInstantSubstitution(element, keyword);
      }
    } catch (error) {
      this.logger.error(`Failed to apply filter: ${error.message}`);
    }
  }

  trackFilteredArticle(element, keyword) {
    try {
      const title = this.extractArticleTitle(element);
      const url = this.extractArticleURL(element);

      if (!title || !url) {
        return;
      }

      const article = {
        title: title,
        keyword: keyword,
        url: url,
        timestamp: Date.now(),
        site: window.location.hostname,
        position: this.getElementPosition(element)
      };

      this.storageManager.queueArticle(article);
    } catch (error) {
      this.logger.error(`Failed to track article: ${error.message}`);
    }
  }

  extractArticleTitle(element) {
    try {
      const headline = element.querySelector('h1, h2, h3, h4, [class*="headline"], [class*="title"]');
      if (headline && headline.textContent.trim()) {
        return headline.textContent.trim();
      }

      const text = element.textContent.trim();
      if (text && text.length > 15) {
        return text.substring(0, 100);
      }

      return 'Untitled Article';
    } catch (error) {
      return 'Untitled Article';
    }
  }

  extractArticleURL(element) {
    try {
      const linkElement = element.tagName === 'A' ? element : element.querySelector('a[href]');
      if (linkElement && linkElement.href) {
        return linkElement.href;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  getElementPosition(element) {
    try {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      return rect.top + scrollTop;
    } catch (error) {
      return 0;
    }
  }

  updatePopupCount() {
    try {
      this.messagingHandler.sendToPopup({
        action: 'updateFilterCount',
        count: this.filteredCount
      });
    } catch (error) {
      this.logger.error(`Failed to update popup: ${error.message}`);
    }
  }

  setKeywords(keywords) {
    this.keywords = keywords || [];
    this.filterCore.setKeywords(this.keywords);
  }

  setEnabled(isEnabled) {
    this.isEnabled = isEnabled;
  }

  setSubstitutionEnabled(enabled) {
    this.substitutionEnabled = enabled;
    console.log(`[NewsFilter v7.0.0] Substitution mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  clearAllOverlays() {
    this.domManipulator.clearAllOverlays();
    this.filteredCount = 0;
  }

  // ============================================================================
  // V7.0.0: SUBSTITUTION METHODS
  // ============================================================================

  async isSubstitutionEnabled() {
    return this.substitutionEnabled && this.contentPoolManager && this.articleMatcher;
  }

  getSiteIdentifier() {
    const hostname = window.location.hostname;
    
    // Map hostname to site identifier
    if (hostname.includes('cnn.com')) return 'cnn';
    if (hostname.includes('bbc.com') || hostname.includes('bbc.co.uk')) return 'bbc';
    if (hostname.includes('yahoo.com')) return 'yahoo';
    if (hostname.includes('ynet.co.il')) return 'ynet';
    
    return null; // Unknown site
  }

  // V8.0.0: DB-backed substitution for image articles
  async performDBSubstitution(element, keyword) {
    try {
      // Skip already substituted articles
      if (element.classList.contains('skeep-substituted')) {
        this.logger.log('[DBSub] Skipping already substituted article');
        return;
      }

      const site = this.getSiteIdentifier();
      if (!site) {
        this.logger.warn('[DBSub] Unknown site, falling back to blur');
        this.domManipulator.applyOverlay(element, keyword);
        this.trackFilteredArticle(element, keyword);
        return;
      }

      // Analyse the image article to extract matching parameters
      const imgElement = element.querySelector('img, picture img');
      let imageWidth = 0;
      let imageHeight = 0;

      if (imgElement) {
        // Use naturalWidth/naturalHeight (true file dimensions) if loaded
        if (imgElement.naturalWidth > 0) {
          imageWidth = imgElement.naturalWidth;
          imageHeight = imgElement.naturalHeight;
        } else {
          // Image not yet loaded — use getBoundingClientRect as fallback
          const rect = imgElement.getBoundingClientRect();
          imageWidth = Math.round(rect.width);
          imageHeight = Math.round(rect.height);
        }
      }

      // Count words in the headline
      const headline = element.querySelector(
        'span.container__headline-text, ' +
        'h2[data-testid="card-headline"], ' +
        'h2, h3, h4, ' +
        '.slotTitle, .title, ' +
        '[class*="headline"], [class*="title"]'
      );
      const headlineText = headline ? headline.textContent.trim() : '';
      const titleWordCount = headlineText.split(/\s+/).filter(w => w.length > 0).length;

      this.logger.log('[DBSub] Analysed article: img=' + imageWidth + 'x' + imageHeight +
        ', words=' + titleWordCount + ', site=' + site + ', keyword=' + keyword);

      // Mark as substituted before async call to prevent re-processing
      element.classList.add('skeep-substituted');

      // Request replacement from background (Supabase query)
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'fetchDBReplacement',
          params: {
            imageWidth: imageWidth,
            imageHeight: imageHeight,
            titleWordCount: titleWordCount,
            keyword: keyword,
            site: site
          }
        }, (resp) => {
          resolve(resp);
        });
      });

      if (!response || !response.success || !response.replacement) {
        this.logger.warn('[DBSub] No DB replacement found, falling back to blur');
        element.classList.remove('skeep-substituted');
        this.domManipulator.applyOverlay(element, keyword);
        this.trackFilteredArticle(element, keyword);
        return;
      }

      const replacement = response.replacement;
      this.logger.log('[DBSub] Got replacement: "' + replacement.title + '" (score: ' + replacement.score + ')');

      // Get the site-specific substitution strategy
      const strategy = window.SubstitutionStrategies?.getStrategy(site);
      if (!strategy || !strategy.substituteWithImage) {
        this.logger.warn('[DBSub] No image substitution strategy for ' + site + ', falling back to blur');
        element.classList.remove('skeep-substituted');
        this.domManipulator.applyOverlay(element, keyword);
        this.trackFilteredArticle(element, keyword);
        return;
      }

      // Perform the image substitution
      const success = strategy.substituteWithImage(element, replacement, keyword);
      if (success) {
        this.logger.log('[DBSub] ✓ SUCCESS — image article replaced from DB');
        this.trackFilteredArticle(element, keyword);
      } else {
        this.logger.warn('[DBSub] substituteWithImage returned false, applying blur fallback');
        element.classList.remove('skeep-substituted');
        this.domManipulator.applyOverlay(element, keyword);
        this.trackFilteredArticle(element, keyword);
      }
    } catch (error) {
      this.logger.error('[DBSub] Error: ' + error.message);
      // On any error, fall back to blur overlay
      try {
        element.classList.remove('skeep-substituted');
        this.domManipulator.applyOverlay(element, keyword);
        this.trackFilteredArticle(element, keyword);
      } catch (e) {
        this.logger.error('[DBSub] Fallback also failed: ' + e.message);
      }
    }
  }

  // V7.3.6: Instant substitution without loading overlay
  async performInstantSubstitution(element, keyword) {
    try {
      // Skip already substituted articles
      if (element.classList.contains('skeep-substituted')) {
        this.logger.log('[InstantSub] Skipping already substituted article');
        return;
      }

      // Mark as substituted immediately
      element.classList.add('skeep-substituted');
      this.logger.log('[InstantSub] Starting instant substitution for keyword: ' + keyword);

      // Get content pool
      const site = this.getSiteIdentifier();
      if (!site) {
        this.logger.warn('[InstantSub] Unknown site');
        return;
      }

      const pool = await this.contentPoolManager.getPool(site);
      if (!pool || pool.length === 0) {
        this.logger.warn('[InstantSub] No content pool available');
        return;
      }

      // Find best match
      const match = await this.articleMatcher.findBestMatch(element, pool, keyword);
      if (!match || !this.articleMatcher.isGoodMatch(match.score)) {
        this.logger.warn('[InstantSub] No good match found');
        return;
      }

      this.logger.log('[InstantSub] Found match: ' + match.article.title);

      // Get substitution strategy
      const strategy = window.SubstitutionStrategies?.getStrategy(site);
      if (!strategy) {
        this.logger.warn('[InstantSub] No substitution strategy');
        return;
      }

      // Perform substitution (instant, no overlay)
      const success = strategy.substitute(element, match.article, keyword);
      if (success) {
        this.logger.log('[InstantSub] ✓ SUCCESS');
        // Apply green border to indicate substitution
        this.domManipulator.applyVisualIndicator(element, 'substituted');
        // Track the substituted article
        this.trackFilteredArticle(element, keyword);
      } else {
        this.logger.warn('[InstantSub] Substitution failed');
      }
    } catch (error) {
      this.logger.error('[InstantSub] Error: ' + error.message);
    }
  }

  async trySubstitution(element, keyword) {
    try {
      // V7.0.5 FIX #1: Skip already substituted articles to prevent infinite loop
      if (element.classList.contains('skeep-substituted')) {
        console.log(`[NewsFilter] Skipping already substituted article`);
        return null;
      }

      // V7.1.2 FIX: Skip articles with images - they should only be filtered, not substituted
      const hasImage = element.querySelector('img, picture, [data-component-name="image"]');
      if (hasImage) {
        console.log(`[NewsFilter] Skipping substitution - article contains image`);
        return null;
      }

      // V7.0.8 FIX: Mark as substituted IMMEDIATELY to prevent race condition
      element.classList.add('skeep-substituted');

      console.log(`[NewsFilter v7.0.0] Attempting substitution for keyword: ${keyword}`);

      // Get current site identifier
      const site = this.getSiteIdentifier();
      if (!site) {
        console.warn(`[NewsFilter] Unknown site, cannot fetch content pool`);
        return null;
      }

      console.log(`[NewsFilter] Site identified as: ${site}`);

      // Get content pool
      const pool = await this.contentPoolManager.getPool(site);
      if (!pool || pool.length === 0) {
        console.warn(`[NewsFilter] No content pool available for substitution`);
        return null;
      }

      console.log(`[NewsFilter] Content pool size: ${pool.length}`);

      // Find best match (V7.0.6: pass keyword to filter out articles containing it)
      const match = await this.articleMatcher.findBestMatch(element, pool, keyword);
      if (!match || !this.articleMatcher.isGoodMatch(match.score)) {
        console.warn(`[NewsFilter] No good match found (score: ${match?.score})`);
        return null;
      }

      console.log(`[NewsFilter] Found match with score ${match.score}:`, match.article.title);

      // V7.1.0: Update loading overlay with actual section name
      this.domManipulator.updateLoadingOverlaySection(element, match.article.section || 'other');

      // Get substitution strategy for current site
      const strategy = window.SubstitutionStrategies?.getStrategy(site);
      if (!strategy) {
        console.warn(`[NewsFilter] No substitution strategy for ${site}`);
        return null;
      }

      // Perform substitution
      const success = strategy.substitute(element, match.article, keyword);
      if (success) {
        console.log(`[NewsFilter] ✓ Substitution successful`);
        return match.article;
      } else {
        console.warn(`[NewsFilter] Substitution failed`);
        return null;
      }
    } catch (error) {
      console.error(`[NewsFilter] Error in trySubstitution:`, error);
      return null;
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let extensionInitialized = false;

function initializeExtension() {
  if (extensionInitialized) {
    return;
  }
  
  extensionInitialized = true;
  window.newsFilterExtension = new NewsFilterExtension();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}
