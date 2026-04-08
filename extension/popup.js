// Popup script for managing keywords and extension settings

// DOM elements
let keywordInput;
let addKeywordButton;
let keywordList;
let emptyState;
let enableToggle;
let statusDot;
let statusText;
let filteredCountElement;
let drawerToggle;  // V2.4
let drawerContainer;  // V2.4
let drawerArrow;  // V2.4
let drawerCount;  // V2.4
let drawerArticles;  // V2.4
let drawerEmpty;  // V2.4
let isDrawerOpen = false;  // V2.4
let filteredArticles = [];  // V2.4

// V4.9: Remote configuration
let configVersionElement;
let refreshConfigBtn;
let currentConfigVersion = 'Loading...';

// Keywords array
let keywords = [];
let isEnabled = true;
let currentFilterCount = 0;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  keywordInput = document.getElementById('keyword-input');
  addKeywordButton = document.getElementById('add-keyword');
  keywordList = document.getElementById('keyword-list');
  emptyState = document.getElementById('empty-state');
  enableToggle = document.getElementById('enable-toggle');
  substitutionToggle = document.getElementById('substitution-toggle'); // V7.0.0
  statusDot = document.getElementById('status-dot');
  statusText = document.getElementById('status-text');
  filteredCountElement = document.getElementById('filtered-count');
  
  // V2.4: Get drawer elements
  drawerToggle = document.getElementById('drawer-toggle');
  drawerContainer = document.getElementById('drawer-container');
  drawerArrow = document.getElementById('drawer-arrow');
  drawerCount = document.getElementById('drawer-count');
  drawerArticles = document.getElementById('drawer-articles');
  drawerEmpty = document.getElementById('drawer-empty');
  
  // V4.9: Get config manager elements
  configVersionElement = document.getElementById('config-version');
  refreshConfigBtn = document.getElementById('refresh-config-btn');
  
  // Load saved keywords and settings
  loadKeywords();
  
  // Add event listeners
  addKeywordButton.addEventListener('click', addKeyword);
  
  // V4.9: Add config refresh listener
  refreshConfigBtn.addEventListener('click', refreshRemoteConfig);
  keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addKeyword();
    }
  });
  
  enableToggle.addEventListener('change', toggleEnabled);
  
  // V7.0.0: Add substitution toggle listener
  substitutionToggle.addEventListener('change', toggleSubstitution);
  
  // V2.4: Add drawer toggle listener
  drawerToggle.addEventListener('click', toggleDrawer);
  
  // V2.4: Load filtered articles from storage
  loadFilteredArticles();
  
  // Check current tab status
  updateCurrentTabStatus();
});

// Load keywords from storage
function loadKeywords() {
  chrome.storage.sync.get(['keywords', 'isEnabled', 'substitutionEnabled'], (result) => {
    keywords = result.keywords || [];
    isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
    const substitutionEnabled = result.substitutionEnabled !== undefined ? result.substitutionEnabled : true; // V7.0.0: default true
    
    // Update UI
    renderKeywords();
    enableToggle.checked = isEnabled;
    substitutionToggle.checked = substitutionEnabled; // V7.0.0
    updateStatusIndicator(isEnabled);
  });
}

// Save keywords to storage
function saveKeywords() {
  chrome.storage.sync.set({ keywords }, () => {
    // Notify content scripts about the update
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateKeywords',
          keywords: keywords
        }).catch(() => {
          // Ignore errors for tabs where content script isn't loaded
        });
      });
    });
  });
}

// Toggle enabled state
function toggleEnabled() {
  isEnabled = enableToggle.checked;
  
  chrome.storage.sync.set({ isEnabled }, () => {
    // Update status indicator
    updateStatusIndicator(isEnabled);
    
    // Notify content scripts about the update
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleEnabled',
          isEnabled: isEnabled
        }).catch(() => {
          // Ignore errors for tabs where content script isn't loaded
        });
      });
    });
    
    // Show feedback to user
    if (isEnabled) {
      showFeedback("Content filtering enabled");
    } else {
      showFeedback("Content filtering disabled", true);
    }
  });
}

// V7.0.0: Toggle substitution mode
function toggleSubstitution() {
  const substitutionEnabled = substitutionToggle.checked;
  
  chrome.storage.sync.set({ substitutionEnabled }, () => {
    // Notify content scripts about the update
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleSubstitution',
          substitutionEnabled: substitutionEnabled
        }).catch(() => {
          // Ignore errors for tabs where content script isn't loaded
        });
      });
    });
    
    // Show feedback to user
    if (substitutionEnabled) {
      showFeedback("Seamless mode enabled - filtered articles will be replaced");
    } else {
      showFeedback("Overlay mode enabled - filtered articles will be highlighted", false);
    }
  });
}

// Add a new keyword
function addKeyword() {
  const keyword = keywordInput.value.trim();
  
  if (keyword) {
    // Check if keyword already exists (case insensitive)
    const keywordLower = keyword.toLowerCase();
    const exists = keywords.some(k => k.toLowerCase() === keywordLower);
    
    if (!exists) {
      keywords.push(keyword);
      saveKeywords();
      renderKeywords();
      keywordInput.value = '';
      
      // Show feedback to user
      showFeedback(`Added "${keyword}" to filter list`);
    } else {
      // Show error feedback
      showFeedback(`"${keyword}" is already in your filter list`, true);
    }
  }
  
  keywordInput.focus();
}

// Show feedback message to user
function showFeedback(message, isError = false) {
  // Create feedback element if it doesn't exist
  let feedback = document.getElementById('feedback-message');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = 'feedback-message';
    feedback.className = 'feedback-message';
    document.getElementById('feedback-container').appendChild(feedback);
  }
  
  // Set message and style
  feedback.textContent = message;
  feedback.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
  feedback.style.color = isError ? '#c62828' : '#2e7d32';
  feedback.style.opacity = '1';
  
  // Hide after 3 seconds
  setTimeout(() => {
    feedback.style.opacity = '0';
  }, 3000);
}

// Remove a keyword
function removeKeyword(index) {
  const removedKeyword = keywords[index];
  keywords.splice(index, 1);
  saveKeywords();
  renderKeywords();
  
  // Show feedback
  showFeedback(`Removed "${removedKeyword}" from filter list`);
}

// Render the keyword list
function renderKeywords() {
  // Clear the list
  keywordList.innerHTML = '';
  
  // Show empty state if no keywords
  if (keywords.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  // Hide empty state
  emptyState.style.display = 'none';
  
  // Add each keyword to the list
  keywords.forEach((keyword, index) => {
    const keywordItem = document.createElement('div');
    keywordItem.className = 'keyword-item';
    
    const keywordText = document.createElement('span');
    keywordText.textContent = keyword;
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-keyword';
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', () => removeKeyword(index));
    
    keywordItem.appendChild(keywordText);
    keywordItem.appendChild(removeButton);
    keywordList.appendChild(keywordItem);
  });
}

// Update the status indicator based on current state
function updateStatusIndicator(active) {
  if (active) {
    statusDot.className = 'status-dot status-active';
    statusText.textContent = 'Filtering active';
  } else {
    statusDot.className = 'status-dot status-inactive';
    statusText.textContent = 'Filtering disabled';
  }
}

// Update the filter count display
function updateFilterCountDisplay(count) {
  currentFilterCount = count;
  if (filteredCountElement) {
    filteredCountElement.textContent = count;
    
    // Update styling based on count
    if (count === 0) {
      filteredCountElement.classList.add('zero');
    } else {
      filteredCountElement.classList.remove('zero');
    }
  }
}

// Check if the extension is active on the current tab
function updateCurrentTabStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    
    const currentTab = tabs[0];
    
    // Try to get status from content script
    chrome.tabs.sendMessage(currentTab.id, { action: 'getStatus' })
      .then(response => {
        if (response && response.isEnabled) {
          updateStatusIndicator(true);
          statusText.textContent = `Filtering active (${response.keywordsCount} keywords)`;
          updateFilterCountDisplay(response.filteredCount || 0);
        } else {
          updateStatusIndicator(false);
          updateFilterCountDisplay(0);
        }
      })
      .catch(() => {
        // Content script not loaded or not responding
        statusText.textContent = 'Not active on this page';
        updateStatusIndicator(false);
        updateFilterCountDisplay(0);
      });
  });
}

// V2.4: Toggle drawer open/closed
function toggleDrawer() {
  isDrawerOpen = !isDrawerOpen;
  
  if (isDrawerOpen) {
    drawerContainer.classList.remove('hidden');
    drawerArrow.classList.add('open');
  } else {
    drawerContainer.classList.add('hidden');
    drawerArrow.classList.remove('open');
  }
}

// V2.4: Load filtered articles from storage
function loadFilteredArticles() {
  chrome.storage.local.get(['filteredArticles'], (result) => {
    filteredArticles = result.filteredArticles || [];
    renderFilteredArticles();
  });
}

// V2.4: Render filtered articles in drawer
function renderFilteredArticles() {
  // V2.5.9: Get current tab's hostname to prioritize current site articles
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let currentSite = '';
    if (tabs.length > 0 && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        currentSite = url.hostname;
      } catch (e) {
        // Invalid URL, use empty string
      }
    }
    
    // V2.6.1: Filter to show ONLY current site articles (no mixing)
    const currentSiteArticles = filteredArticles
      .filter(article => article.site === currentSite)
      .sort((a, b) => {
        // V2.8.4: Sort ONLY by position (top to bottom on page)
        // Position reflects current page layout, which is what matters
        return a.position - b.position;
      })
    
    // Update count (only current site articles)
    const count = currentSiteArticles.length;
    drawerCount.textContent = count;
    
    // Update count styling
    if (count === 0) {
      drawerCount.classList.add('zero');
    } else {
      drawerCount.classList.remove('zero');
    }
    
    // Clear articles container
    drawerArticles.innerHTML = '';
    
    // Show/hide empty state
    if (count === 0) {
      drawerEmpty.style.display = 'block';
      drawerArticles.style.display = 'none';
    } else {
      drawerEmpty.style.display = 'none';
      drawerArticles.style.display = 'block';
      
      // V2.6.1: Render each article (only current site)
      currentSiteArticles.forEach((article) => {
      const entry = document.createElement('div');
      entry.className = 'article-entry';
      
      // V2.5: Add website logo (favicon)
      const logo = document.createElement('img');
      logo.className = 'article-logo';
      // Use Google's favicon service or direct favicon URL
      const domain = article.site || new URL(article.url).hostname;
      logo.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      logo.alt = domain;
      logo.onerror = function() {
        // Fallback: Use a generic icon if favicon fails to load
        this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
      };
      
      // V2.5: Article content container
      const content = document.createElement('div');
      content.className = 'article-content';
      
      const badge = document.createElement('span');
      badge.className = 'keyword-badge';
      badge.textContent = article.keyword;
      
      const title = document.createElement('p');
      title.className = 'article-title';
      title.textContent = article.title;
      
      // V2.7: Detect Hebrew text and set RTL direction
      if (/[\u0590-\u05FF]/.test(article.title)) {
        title.setAttribute('dir', 'rtl');
      }
      
      content.appendChild(badge);
      content.appendChild(title);
      
      // V2.5: Add clickable link icon
      const linkIcon = document.createElement('div');
      linkIcon.className = 'article-link-icon';
      linkIcon.title = 'Open article in new tab';
      linkIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
      `;
      linkIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.tabs.create({ url: article.url });
      });
      
      entry.appendChild(logo);
      entry.appendChild(content);
      entry.appendChild(linkIcon);
      drawerArticles.appendChild(entry);
    });
    }
  });
}

// V2.4: Add filtered article to storage
function addFilteredArticle(article) {
  // Add to beginning (most recent first)
  filteredArticles.unshift(article);
  
  // Keep only last 10
  if (filteredArticles.length > 10) {
    filteredArticles = filteredArticles.slice(0, 10);
  }
  
  // Save to storage
  chrome.storage.local.set({ filteredArticles }, () => {
    renderFilteredArticles();
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateFilterCount') {
    updateFilterCountDisplay(message.count);
  }
  
  // V2.4: Handle new filtered article
  if (message.type === 'articleFiltered') {
    addFilteredArticle(message.article);
  }
});

/**
 * V4.9: Refresh remote configuration
 */
function refreshRemoteConfig() {
  console.log('[Popup] Refreshing remote configuration...');
  
  refreshConfigBtn.disabled = true;
  refreshConfigBtn.classList.add('loading');
  
  // Send message to background script
  chrome.runtime.sendMessage({ action: 'refreshConfig' }, (response) => {
    refreshConfigBtn.classList.remove('loading');
    refreshConfigBtn.disabled = false;
    
    if (response && response.success) {
      console.log('[Popup] Config refreshed successfully:', response.version);
      currentConfigVersion = response.version;
      updateConfigStatus();
      
      // Show success message
      showConfigMessage('Configuration updated to v' + response.version, 'success');
    } else {
      console.error('[Popup] Config refresh failed:', response?.error);
      showConfigMessage('Failed to refresh configuration', 'error');
    }
  });
}

/**
 * V4.9: Update config status display
 */
function updateConfigStatus() {
  if (configVersionElement) {
    configVersionElement.textContent = currentConfigVersion;
  }
  
  // Get cache info from background
  chrome.runtime.sendMessage({ action: 'getCacheInfo' }, (info) => {
    if (info && info.cached) {
      console.log('[Popup] Config cache info:', info);
      // Could display more detailed cache info here
    }
  });
}

/**
 * V4.9: Show config message
 */
function showConfigMessage(message, type) {
  const messageEl = document.createElement('div');
  messageEl.className = 'config-message ' + type;
  messageEl.textContent = message;
  
  const configStatus = document.getElementById('config-status');
  configStatus.parentNode.insertBefore(messageEl, configStatus.nextSibling);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    messageEl.remove();
  }, 3000);
}

// Initialize config status on popup load
updateConfigStatus();

// Load and display extension version from manifest
function loadExtensionVersion() {
  const manifest = chrome.runtime.getManifest();
  const titleElement = document.getElementById('extension-title');
  if (titleElement && manifest.version) {
    titleElement.textContent = `News Filter v${manifest.version}`;
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
  loadExtensionVersion();
});
