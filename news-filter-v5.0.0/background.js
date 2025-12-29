// Remote configuration management

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
    console.log('[Background] Manual config refresh requested');
    configManager.getConfig().then(async (config) => {
      const cacheInfo = await configManager.getCacheInfo();
      sendResponse({ 
        success: true, 
        version: config.version,
        cacheInfo: cacheInfo
      });
    }).catch((error) => {
      console.error('[Background] Config refresh failed:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getCacheInfo') {
    configManager.getCacheInfo().then((info) => {
      sendResponse(info);
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
  
  console.log('[News Filter v2.3] Extension installed. CSP bypass enabled for problematic sites.');
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
      console.log(`[News Filter v2.3] Detected problematic domain in ${tab.url}. Using programmatic injection.`);
      
      // Programmatically inject the content script to bypass CSP
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/index.js'],
        world: 'MAIN'
      }).then(() => {
        console.log(`[News Filter v2.3] Content script injected into tab ${tabId}`);
      }).catch(err => {
        console.error(`[News Filter v2.3] Error injecting content script: ${err}`);
      });
    }
  }
});

/**
 * Listen for messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStatus') {
    // Get current status from storage and respond
    chrome.storage.sync.get(['keywords', 'isEnabled'], (result) => {
      sendResponse({
        isEnabled: result.isEnabled !== undefined ? result.isEnabled : true,
        keywordsCount: (result.keywords || []).length,
        filteredCount: message.filteredCount || 0
      });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  // Handle filtered count updates from content script
  if (message.action === 'updateFilterCount') {
    const count = message.count || 0;
    console.log(`[News Filter v2.3] Received filtered count update: ${count}`);
    
    // Forward the count to the popup if it's open
    chrome.runtime.sendMessage({
      action: 'updateFilterCount',
      count: count
    }).catch(err => {
      // Ignore errors when popup is not open
      if (!err.message.includes('receiving end does not exist')) {
        console.error(`[News Filter v2.3] Error forwarding count: ${err}`);
      }
    });
    
    sendResponse({ success: true });
    return true;
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
