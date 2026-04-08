/**
 * Section Articles Popup Handler
 * v6.2.3 - Handles section selection with dynamic buttons based on current site
 * 
 * Features:
 * - Dynamic button generation based on detected site
 * - CNN shows CNN sections
 * - BBC shows BBC sections
 * - Error handling for unsupported sites
 * - Loading timeout (5 seconds)
 */

let currentSection = null;
let currentSite = null;
let sectionArticles = {};
let loadingTimeout = null;
const LOADING_TIMEOUT = 5000; // 5 seconds

/**
 * Initialize section articles feature
 */
function initSectionArticles() {
  console.log('[v6.2.3] Initializing section articles feature');
  
  // Detect current site and generate buttons
  detectCurrentSite();
  
  // Setup drawer toggle
  const sectionDrawerToggle = document.getElementById('section-drawer-toggle');
  if (sectionDrawerToggle) {
    sectionDrawerToggle.addEventListener('click', toggleSectionDrawer);
  }
  
  // Hide drawer initially (until section is selected)
  const sectionDrawerContainer = document.getElementById('section-drawer-container');
  const sectionDrawerToggleBtn = document.getElementById('section-drawer-toggle');
  if (sectionDrawerContainer) sectionDrawerContainer.classList.add('hidden');
  if (sectionDrawerToggleBtn) sectionDrawerToggleBtn.classList.add('hidden');
  
  console.log('[v6.2.3] Section articles initialized');
}

/**
 * Detect the current news website and generate appropriate buttons
 */
function detectCurrentSite() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;
    
    const hostname = new URL(tabs[0].url).hostname;
    console.log('[v6.2.3] Current hostname:', hostname);
    
    // Detect site based on hostname
    if (hostname.includes('cnn.com')) {
      currentSite = 'cnn';
      console.log('[v6.2.3] Detected CNN');
      generateButtonsForSite('cnn');
      enableSectionButtons();
    } else if (hostname.includes('bbc.com')) {
      currentSite = 'bbc';
      console.log('[v6.2.3] Detected BBC');
      generateButtonsForSite('bbc');
      enableSectionButtons();
    } else if (hostname.includes('yahoo.com')) {
      currentSite = 'yahoo';
      console.log('[v6.4.0] Detected Yahoo');
      generateButtonsForSite('yahoo');
      enableSectionButtons();
    } else if (hostname.includes('ynet.co.il')) {
      currentSite = 'ynet';
      console.log('[v6.2.3] Detected Ynet');
      generateButtonsForSite('ynet');
      enableSectionButtons();
    } else {
      currentSite = null;
      console.log('[v6.2.3] Site not supported:', hostname);
      disableSectionButtons();
      showUnsupportedSiteMessage();
    }
  });
}

/**
 * Generate buttons for a specific site
 * @param {string} siteKey - The site key (cnn, bbc, yahoo, ynet)
 */
function generateButtonsForSite(siteKey) {
  const sectionButtonsContainer = document.getElementById('section-buttons');
  if (!sectionButtonsContainer) return;
  
  // Clear existing buttons
  sectionButtonsContainer.innerHTML = '';
  
  // Get sections for this site
  let sections = {};
  if (siteKey === 'cnn' && typeof CNN_SECTIONS !== 'undefined') {
    sections = CNN_SECTIONS;
  } else if (siteKey === 'bbc' && typeof BBC_SECTIONS !== 'undefined') {
    sections = BBC_SECTIONS;
  } else if (siteKey === 'yahoo' && typeof YAHOO_SECTIONS !== 'undefined') {
    sections = YAHOO_SECTIONS;
  } else if (siteKey === 'ynet' && typeof YNET_SECTIONS !== 'undefined') {
    sections = YNET_SECTIONS;
  }
  
  console.log('[v6.2.3] Generating buttons for', siteKey, 'with', Object.keys(sections).length, 'sections');
  
  // Create buttons for each section
  Object.entries(sections).forEach(([sectionKey, sectionData]) => {
    const button = document.createElement('button');
    button.className = 'section-button';
    button.dataset.section = sectionKey;
    button.textContent = sectionData.name;
    
    button.addEventListener('click', () => {
      selectSection(sectionKey, button);
    });
    
    sectionButtonsContainer.appendChild(button);
  });
  
  console.log('[v6.2.3] Generated', sectionButtonsContainer.children.length, 'buttons');
}

/**
 * Enable section buttons
 */
function enableSectionButtons() {
  const buttons = document.querySelectorAll('.section-button');
  buttons.forEach(btn => {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  });
}

/**
 * Disable section buttons
 */
function disableSectionButtons() {
  const buttons = document.querySelectorAll('.section-button');
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  });
}

/**
 * Show message for unsupported sites
 */
function showUnsupportedSiteMessage() {
  const sectionSelector = document.getElementById('section-selector');
  if (sectionSelector) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      padding: 12px;
      margin-top: 10px;
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      color: #856404;
      font-size: 13px;
      text-align: center;
    `;
    messageDiv.innerHTML = `
      <strong>⚠️ Site Not Supported</strong><br>
      Unfortunately we don't support this site yet.<br>
      <small style="font-size: 11px; margin-top: 6px; display: block;">Supported: CNN, BBC, Yahoo News, Ynet</small>
    `;
    sectionSelector.appendChild(messageDiv);
  }
}

/**
 * Select a section and fetch articles
 * @param {string} sectionKey - The section key
 * @param {HTMLElement} buttonEl - The button element clicked
 */
function selectSection(sectionKey, buttonEl) {
  console.log('[v6.2.3] Selecting section:', sectionKey, 'on site:', currentSite);
  
  // Check if site is supported
  if (!currentSite) {
    showSectionError('Site not supported. Please visit a supported news site (CNN, BBC, Yahoo News, or Ynet).', sectionKey);
    return;
  }
  
  // Update active button
  document.querySelectorAll('.section-button').forEach(btn => {
    btn.classList.remove('active');
  });
  buttonEl.classList.add('active');
  
  currentSection = sectionKey;
  
  // Show drawer and toggle button
  const sectionDrawerContainer = document.getElementById('section-drawer-container');
  const sectionDrawerToggle = document.getElementById('section-drawer-toggle');
  
  sectionDrawerContainer.classList.remove('hidden');
  sectionDrawerToggle.classList.remove('hidden');
  
  // Update drawer title
  const sectionDrawerTitle = document.getElementById('section-drawer-title');
  if (sectionDrawerTitle) {
    sectionDrawerTitle.textContent = buttonEl.textContent + ' (' + currentSite.toUpperCase() + ')';
  }
  
  // Show loading state
  const articlesDiv = document.getElementById('section-drawer-articles');
  const sectionDrawerEmpty = document.getElementById('section-drawer-empty');
  
  articlesDiv.innerHTML = `
    <div class="section-loading" style="padding: 20px; text-align: center;">
      <div style="color: #666; font-size: 13px; margin-bottom: 10px;">Loading articles...</div>
      <div style="width: 30px; height: 30px; margin: 0 auto; border: 3px solid #f3f3f3; border-top: 3px solid #4285F4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
  `;
  sectionDrawerEmpty.style.display = 'none';
  
  // Add CSS animation for spinner if not already present
  if (!document.getElementById('section-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'section-spinner-style';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Check if we have cached articles
  const cacheKey = currentSite + ':' + sectionKey;
  if (sectionArticles[cacheKey]) {
    console.log('[v6.2.3] Using cached articles for', cacheKey);
    clearTimeout(loadingTimeout);
    displaySectionArticles(sectionArticles[cacheKey]);
  } else {
    // Set loading timeout
    loadingTimeout = setTimeout(() => {
      console.error('[v6.2.3] Loading timeout after ' + LOADING_TIMEOUT + 'ms');
      showSectionError('Loading took too long. Please try again.', sectionKey);
    }, LOADING_TIMEOUT);
    
    // Fetch articles from background with site key
    chrome.runtime.sendMessage(
      { 
        action: 'fetchSectionArticles', 
        sectionKey: sectionKey,
        siteKey: currentSite  // Pass site key
      },
      (response) => {
        // Clear loading timeout
        clearTimeout(loadingTimeout);
        
        if (chrome.runtime.lastError) {
          console.error('[v6.2.3] Message error:', chrome.runtime.lastError);
          showSectionError('Failed to communicate with extension: ' + chrome.runtime.lastError.message, sectionKey);
          return;
        }
        
        if (response && response.success) {
          sectionArticles[cacheKey] = response.articles;
          displaySectionArticles(response.articles);
        } else {
          const errorMsg = response ? response.error : 'Unknown error';
          console.error('[v6.2.3] Error response:', errorMsg);
          showSectionError(errorMsg, sectionKey);
        }
      }
    );
  }
}

/**
 * Display section articles in drawer
 * @param {Array} articles - Array of article objects
 */
function displaySectionArticles(articles) {
  const articlesDiv = document.getElementById('section-drawer-articles');
  const sectionDrawerEmpty = document.getElementById('section-drawer-empty');
  const sectionDrawerCount = document.getElementById('section-drawer-count');
  
  if (!articles || articles.length === 0) {
    articlesDiv.innerHTML = '';
    sectionDrawerEmpty.style.display = 'block';
    sectionDrawerEmpty.textContent = 'No articles found for this section';
    sectionDrawerCount.textContent = '0';
    sectionDrawerCount.classList.add('zero');
    return;
  }
  
  articlesDiv.innerHTML = '';
  sectionDrawerEmpty.style.display = 'none';
  sectionDrawerCount.classList.remove('zero');
  
  articles.forEach(article => {
    const entry = document.createElement('div');
    entry.className = 'article-entry';
    entry.style.cursor = 'pointer';
    
    // Detect RTL for Hebrew text
    const isRTL = /[\u0590-\u05FF]/.test(article.title);
    
    entry.innerHTML = `
      <div class="article-content" style="flex: 1;">
        <div class="article-title" ${isRTL ? 'dir="rtl"' : ''} style="font-size: 13px; color: #333; line-height: 1.4;">${escapeHtmlSection(article.title)}</div>
      </div>
      <div class="article-link-icon" title="Open article" style="width: 16px; height: 16px; flex-shrink: 0; opacity: 0.6;">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="fill: #4285F4;">
          <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
      </div>
    `;
    
    // Open link in new tab when clicked
    entry.addEventListener('click', () => {
      chrome.tabs.create({ url: article.url });
    });
    
    articlesDiv.appendChild(entry);
  });
  
  sectionDrawerCount.textContent = articles.length;
}

/**
 * Show error message in section drawer
 * @param {string} error - Error message
 * @param {string} sectionKey - The section key for retry
 */
function showSectionError(error, sectionKey) {
  const articlesDiv = document.getElementById('section-drawer-articles');
  const sectionDrawerCount = document.getElementById('section-drawer-count');
  
  sectionDrawerCount.textContent = '!';
  sectionDrawerCount.classList.add('zero');
  
  articlesDiv.innerHTML = `
    <div class="section-error" style="padding: 12px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin-top: 8px; font-size: 12px;">
      <div style="margin-bottom: 10px;">❌ ${escapeHtmlSection(error)}</div>
      <button class="section-retry-btn" style="background-color: #4285F4; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px; transition: background-color 0.2s;">Retry</button>
    </div>
  `;
  
  // Add retry button listener
  articlesDiv.querySelector('.section-retry-btn').addEventListener('click', () => {
    // Clear cache for this section
    const cacheKey = currentSite + ':' + sectionKey;
    delete sectionArticles[cacheKey];
    
    const button = document.querySelector(`[data-section="${sectionKey}"]`);
    if (button) {
      selectSection(sectionKey, button);
    }
  });
}

/**
 * Toggle section drawer visibility
 */
function toggleSectionDrawer() {
  const drawer = document.getElementById('section-drawer-container');
  const arrow = document.getElementById('section-drawer-arrow');
  
  drawer.classList.toggle('hidden');
  if (arrow) {
    arrow.classList.toggle('open');
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtmlSection(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', () => {
  initSectionArticles();
});
