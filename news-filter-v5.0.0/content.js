/**
 * News Filter Extension v5.0.0 - BUNDLED CONTENT SCRIPT
 * Includes Phase 4 (Layout-Aware Substitution) and Phase 2.5 (Pre-emptive CSS Injection)
 * 
 * This is a complete bundled version for Chrome content script compatibility
 */

// Guard clause to prevent double initialization
if (window.newsFilterExtensionLoaded) {
  console.log('[News Filter v5.0.0] Extension already loaded, skipping initialization');
  throw new Error('News Filter Extension already initialized');
}
window.newsFilterExtensionLoaded = true;

// ============================================================================
// LOGGER UTILITY
// ============================================================================

class Logger {
  constructor(debug = false) {
    this.debug = debug;
    this.prefix = '[News Filter v5.0.0]';
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
// PHASE 2.5: CSS INJECTION MANAGER
// ============================================================================

class CSSInjectionManager {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.injectedStyleId = 'news-filter-preemptive-css';
    this.cleanupStyleId = 'news-filter-cleanup-css';
    this.safeElements = new WeakSet();
  }

  injectPreemptiveCSS() {
    try {
      const selectors = this.getArticleSelectors();
      if (selectors.length === 0) {
        this.logger.log('No article selectors found for CSS injection');
        return;
      }

      const cssRule = selectors.join(', ') + ' { display: none !important; }';
      
      const style = document.createElement('style');
      style.id = this.injectedStyleId;
      style.textContent = cssRule;
      
      document.head.appendChild(style);
      this.logger.info('Phase 2.5: Preemptive CSS injected');
    } catch (error) {
      this.logger.error(`Failed to inject preemptive CSS: ${error.message}`);
    }
  }

  cleanupPreemptiveCSS() {
    try {
      const style = document.getElementById(this.injectedStyleId);
      if (style) {
        style.remove();
        this.logger.log('Preemptive CSS removed');
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup preemptive CSS: ${error.message}`);
    }
  }

  injectCleanupCSS() {
    try {
      const style = document.createElement('style');
      style.id = this.cleanupStyleId;
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .news-filter-safe-article {
          animation: fadeIn 0.3s ease-in;
        }
      `;
      document.head.appendChild(style);
      this.logger.log('Cleanup CSS injected');
    } catch (error) {
      this.logger.error(`Failed to inject cleanup CSS: ${error.message}`);
    }
  }

  markAsSafe(element) {
    try {
      this.safeElements.add(element);
      element.classList.add('news-filter-safe-article');
    } catch (error) {
      this.logger.error(`Failed to mark element as safe: ${error.message}`);
    }
  }

  getArticleSelectors() {
    const selectors = [];
    
    if (this.siteConfig.articleSelectors) {
      selectors.push(...this.siteConfig.articleSelectors);
    }
    if (this.siteConfig.headlineSelectors) {
      selectors.push(...this.siteConfig.headlineSelectors);
    }
    
    // Fallback selectors
    if (selectors.length === 0) {
      selectors.push('article', '.article', '[role="article"]', 'li.stream-item', 'li.ntk-item');
    }
    
    return selectors;
  }
}

// ============================================================================
// PHASE 4: LAYOUT VALIDATOR
// ============================================================================

class LayoutValidator {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.dimensionCache = new Map();
    this.cacheExpiry = siteConfig.substitution?.cacheExpiry || 5000;
    this.defaultTolerance = {
      width: 0.25,    // ±25% (more forgiving)
      height: 0.25,   // ±25% (more forgiving)
      aspectRatio: 0.25  // ±25% (more forgiving)
    };
  }

  isCompatible(filteredElement, candidateElement) {
    if (!filteredElement || !candidateElement) {
      return false;
    }

    try {
      if (!this.isVisible(candidateElement)) {
        return false;
      }

      const filteredDims = this.getDimensions(filteredElement);
      const candidateDims = this.getDimensions(candidateElement);

      if (!filteredDims || !candidateDims) {
        return false;
      }

      const tolerance = this.getTolerance();
      
      const widthDiff = Math.abs(filteredDims.width - candidateDims.width) / filteredDims.width;
      const heightDiff = Math.abs(filteredDims.height - candidateDims.height) / filteredDims.height;
      
      if (widthDiff > tolerance.width || heightDiff > tolerance.height) {
        return false;
      }

      const filteredAspect = filteredDims.width / filteredDims.height;
      const candidateAspect = candidateDims.width / candidateDims.height;
      const aspectDiff = Math.abs(filteredAspect - candidateAspect) / filteredAspect;
      
      if (aspectDiff > tolerance.aspectRatio) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Compatibility check failed: ${error.message}`);
      return false;
    }
  }

  getDimensions(element) {
    try {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height
      };
    } catch (error) {
      return null;
    }
  }

  isVisible(element) {
    try {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    } catch (error) {
      return false;
    }
  }

  getTolerance() {
    const siteConfig = this.siteConfig.substitution || {};
    return {
      width: siteConfig.dimensionTolerance?.width || this.defaultTolerance.width,
      height: siteConfig.dimensionTolerance?.height || this.defaultTolerance.height,
      aspectRatio: siteConfig.aspectRatioTolerance || this.defaultTolerance.aspectRatio
    };
  }
}

// ============================================================================
// PHASE 4: REPLACEMENT POOL
// ============================================================================

class ReplacementPool {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.pool = [];
    this.usedArticles = new Set();
    this.maxPoolSize = siteConfig.substitution?.maxPoolSize || 50;
  }

  initialize(articles) {
    try {
      // Filter out invalid articles and limit pool size
      this.pool = articles.filter(a => a && a.nodeType === 1).slice(0, this.maxPoolSize);
      this.logger.log(`Pool initialized with ${this.pool.length} articles`);
    } catch (error) {
      this.logger.error(`Failed to initialize pool: ${error.message}`);
    }
  }

  addArticles(articles) {
    try {
      const newArticles = articles.filter(a => a && a.nodeType === 1 && !this.isInPool(a));
      this.pool.push(...newArticles);
      
      if (this.pool.length > this.maxPoolSize) {
        this.pool = this.pool.slice(0, this.maxPoolSize);
      }
      
      this.logger.log(`Added ${newArticles.length} articles to pool (total: ${this.pool.length})`);
    } catch (error) {
      this.logger.error(`Failed to add articles: ${error.message}`);
    }
  }

  getCompatibleArticle(element, validator) {
    try {
      for (let i = 0; i < this.pool.length; i++) {
        const candidate = this.pool[i];
        if (!this.usedArticles.has(candidate) && validator.isCompatible(element, candidate)) {
          this.usedArticles.add(candidate);
          return candidate;
        }
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get compatible article: ${error.message}`);
      return null;
    }
  }

  isInPool(article) {
    return this.pool.some(a => a === article);
  }

  isEmpty() {
    return this.pool.length === 0 || this.usedArticles.size >= this.pool.length;
  }

  getStatus() {
    return {
      total: this.pool.length,
      used: this.usedArticles.size,
      available: this.pool.length - this.usedArticles.size,
      max: this.maxPoolSize
    };
  }
}

// ============================================================================
// PHASE 4: PLACEHOLDER TEMPLATE MANAGER
// ============================================================================

class PlaceholderTemplateManager {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
  }

  createPlaceholder(keyword) {
    try {
      const placeholder = document.createElement('div');
      placeholder.className = 'news-filter-placeholder';
      placeholder.style.cssText = `
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 16px;
        text-align: center;
        color: #666;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      placeholder.innerHTML = `
        <div>
          <p style="margin: 0; font-weight: 500;">Content filtered</p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">Keyword: <strong>${keyword}</strong></p>
        </div>
      `;
      
      return placeholder;
    } catch (error) {
      this.logger.error(`Failed to create placeholder: ${error.message}`);
      return null;
    }
  }

  createSkeletonLoader() {
    try {
      const skeleton = document.createElement('div');
      skeleton.className = 'news-filter-skeleton';
      skeleton.style.cssText = `
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
        min-height: 100px;
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
      
      return skeleton;
    } catch (error) {
      this.logger.error(`Failed to create skeleton loader: ${error.message}`);
      return null;
    }
  }
}

// ============================================================================
// PHASE 4: SUBSTITUTION MANAGER
// ============================================================================

class SubstitutionManager {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.layoutValidator = new LayoutValidator(siteConfig, options);
    this.replacementPool = new ReplacementPool(siteConfig, options);
    this.placeholderManager = new PlaceholderTemplateManager(siteConfig, options);
    this.substitutionStats = {
      tier1: 0,
      tier2: 0,
      tier3: 0,
      tier4: 0,
      tier5: 0
    };
  }

  initializePool(articles) {
    try {
      this.replacementPool.initialize(articles);
      this.logger.info('Phase 4: Replacement pool initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize pool: ${error.message}`);
    }
  }

  addArticlesToPool(articles) {
    try {
      this.replacementPool.addArticles(articles);
    } catch (error) {
      this.logger.error(`Failed to add articles to pool: ${error.message}`);
    }
  }

  async substitute(element, keyword) {
    try {
      // Tier 1: Layout-Aware Replacement
      const compatible = this.replacementPool.getCompatibleArticle(element, this.layoutValidator);
      if (compatible) {
        this.replaceElement(element, compatible);
        this.substitutionStats.tier1++;
        this.logger.info('✓ Tier 1 (Layout-Aware) succeeded');
        return true;
      }

      // Tier 3: Generic Placeholder
      const placeholder = this.placeholderManager.createPlaceholder(keyword);
      if (placeholder) {
        element.replaceWith(placeholder);
        this.substitutionStats.tier3++;
        this.logger.info('✓ Tier 3 (Generic Placeholder) succeeded');
        return true;
      }

      // Tier 5: Element Concealment
      element.style.visibility = 'hidden';
      element.style.height = '0';
      element.style.margin = '0';
      element.style.padding = '0';
      this.substitutionStats.tier5++;
      this.logger.info('✓ Tier 5 (Element Concealment) succeeded');
      return true;
    } catch (error) {
      this.logger.error(`Substitution failed: ${error.message}`);
      return false;
    }
  }

  replaceElement(original, replacement) {
    try {
      const clone = replacement.cloneNode(true);
      original.replaceWith(clone);
    } catch (error) {
      this.logger.error(`Failed to replace element: ${error.message}`);
    }
  }

  getStats() {
    return this.substitutionStats;
  }
}

// ============================================================================
// DEFAULT SITE STRATEGIES
// ============================================================================

function getSiteConfig(hostname) {
  const configs = {
    'yahoo.com': {
      articleSelectors: ['li.stream-item', 'li.ntk-item', 'div.stream-item'],
      headlineSelectors: ['h2', 'h3'],
      substitution: { enabled: true, dimensionTolerance: { width: 0.20, height: 0.20 }, maxPoolSize: 50 }
    },
    'bbc.com': {
      articleSelectors: ['[data-testid="dundee-card"]', '[data-testid="manchester-card"]', 'div[data-testid*="card"]'],
      headlineSelectors: ['h2', 'h3'],
      substitution: { enabled: true, dimensionTolerance: { width: 0.05, height: 0.05 }, maxPoolSize: 50 }
    },
    'cnn.com': {
      articleSelectors: ['li.card.container__item', 'div.card', 'article'],
      headlineSelectors: ['span.container__headline-text', 'h3'],
      substitution: { enabled: true, dimensionTolerance: { width: 0.15, height: 0.15 }, maxPoolSize: 50 }
    },
    'theguardian.com': {
      articleSelectors: ['a[data-link-name="article"]', 'div[data-component-name="Card"]', 'article'],
      headlineSelectors: ['h3', 'span[data-component-name="Headline"]'],
      substitution: { enabled: true, dimensionTolerance: { width: 0.15, height: 0.15 }, maxPoolSize: 50 }
    }
  };

  for (const [domain, config] of Object.entries(configs)) {
    if (hostname.includes(domain)) {
      return config;
    }
  }

  return {
    articleSelectors: ['article', '.article', '[role="article"]', 'li.stream-item'],
    headlineSelectors: ['h1', 'h2', 'h3', 'h4'],
    substitution: { enabled: true, dimensionTolerance: { width: 0.15, height: 0.15 }, maxPoolSize: 50 }
  };
}

// ============================================================================
// FILTER CORE
// ============================================================================

class FilterCore {
  constructor(keywords = [], options = {}) {
    this.keywords = keywords;
    this.logger = new Logger(options.debug);
  }

  shouldFilter(element) {
    try {
      const text = element.textContent.toLowerCase();
      for (const keyword of this.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return keyword;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  setKeywords(keywords) {
    this.keywords = keywords || [];
  }
}

// ============================================================================
// ARTICLE DETECTOR
// ============================================================================

class ArticleDetector {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.processedElements = new WeakSet();
  }

  findArticles(context = document) {
    try {
      const selectors = this.siteConfig.articleSelectors || ['article', '.article'];
      const articles = [];
      
      for (const selector of selectors) {
        try {
          const elements = context.querySelectorAll(selector);
          articles.push(...elements);
        } catch (e) {
          // Invalid selector, skip
        }
      }
      
      return Array.from(new Set(articles));
    } catch (error) {
      this.logger.error(`Failed to find articles: ${error.message}`);
      return [];
    }
  }

  findHeadlines(context = document) {
    try {
      const selectors = this.siteConfig.headlineSelectors || ['h1', 'h2', 'h3'];
      const headlines = [];
      
      for (const selector of selectors) {
        try {
          const elements = context.querySelectorAll(selector);
          headlines.push(...elements);
        } catch (e) {
          // Invalid selector, skip
        }
      }
      
      return Array.from(new Set(headlines));
    } catch (error) {
      this.logger.error(`Failed to find headlines: ${error.message}`);
      return [];
    }
  }

  isProcessed(element) {
    return this.processedElements.has(element);
  }

  markAsProcessed(element) {
    this.processedElements.add(element);
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
    try {
      const overlay = document.createElement('div');
      overlay.className = 'news-filter-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 0, 0, 0.3);
        border: 2px solid red;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-weight: bold;
        color: red;
      `;
      overlay.textContent = `Filtered: ${keyword}`;
      
      if (element.style.position === 'static') {
        element.style.position = 'relative';
      }
      
      element.appendChild(overlay);
    } catch (error) {
      this.logger.error(`Failed to apply overlay: ${error.message}`);
    }
  }

  clearAllOverlays() {
    try {
      const overlays = document.querySelectorAll('.news-filter-overlay');
      overlays.forEach(overlay => overlay.remove());
    } catch (error) {
      this.logger.error(`Failed to clear overlays: ${error.message}`);
    }
  }
}

// ============================================================================
// STORAGE MANAGER
// ============================================================================

class StorageManager {
  constructor(options = {}) {
    this.logger = new Logger(options.debug);
  }

  async loadKeywords() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['keywords'], result => {
        resolve(result.keywords || []);
      });
    });
  }

  async loadEnabledState() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['isEnabled'], result => {
        resolve(result.isEnabled !== false);
      });
    });
  }

  async saveKeywords(keywords) {
    return new Promise(resolve => {
      chrome.storage.sync.set({ keywords }, resolve);
    });
  }

  async saveEnabledState(isEnabled) {
    return new Promise(resolve => {
      chrome.storage.sync.set({ isEnabled }, resolve);
    });
  }

  queueArticle(article) {
    // Placeholder for article tracking
  }
}

// ============================================================================
// MESSAGING HANDLER
// ============================================================================

class MessagingHandler {
  constructor(extension, options = {}) {
    this.extension = extension;
    this.logger = new Logger(options.debug);
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        if (request.action === 'setKeywords') {
          this.extension.setKeywords(request.keywords);
          sendResponse({ success: true });
        } else if (request.action === 'setEnabled') {
          this.extension.setEnabled(request.enabled);
          sendResponse({ success: true });
        }
      } catch (error) {
        this.logger.error(`Message handling failed: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      }
    });
  }

  sendToPopup(message) {
    try {
      chrome.runtime.sendMessage(message).catch(() => {
        // Popup not open, ignore
      });
    } catch (error) {
      this.logger.error(`Failed to send message to popup: ${error.message}`);
    }
  }
}

// ============================================================================
// OPTIMIZED OBSERVER
// ============================================================================

class OptimizedObserver {
  constructor(extension, options = {}) {
    this.extension = extension;
    this.logger = new Logger(options.debug);
    this.observer = null;
  }

  setup() {
    try {
      const config = {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      };

      this.observer = new MutationObserver((mutations) => {
        const addedNodes = [];
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                addedNodes.push(node);
              }
            });
          }
        });

        if (addedNodes.length > 0) {
          this.extension.scanAddedNodes(addedNodes);
        }
      });

      this.observer.observe(document.body, config);
      this.logger.log('Observer setup complete');
    } catch (error) {
      this.logger.error(`Failed to setup observer: ${error.message}`);
    }
  }
}

// ============================================================================
// MAIN EXTENSION CLASS
// ============================================================================

class NewsFilterExtension {
  constructor() {
    this.logger = new Logger(true); // Enable logging
    this.keywords = [];
    this.isEnabled = true;
    this.filteredCount = 0;
    this.siteConfig = null;
    this.filterCore = null;
    this.detector = null;
    this.observer = null;
    this.domManipulator = null;
    this.storageManager = null;
    this.messagingHandler = null;
    
    // Phase 2.5: CSS Injection Manager
    this.cssInjectionManager = null;
    
    // Phase 4: Substitution Manager
    this.substitutionManager = null;
    
    this.logger.info('Initializing News Filter Extension v5.0.0');
    this.init();
  }

  async init() {
    try {
      const hostname = window.location.hostname;
      this.siteConfig = getSiteConfig(hostname);
      this.logger.log(`Using config for: ${hostname}`);

      // Initialize Phase 2.5: CSS Injection Manager
      this.cssInjectionManager = new CSSInjectionManager(this.siteConfig, { debug: true });
      this.cssInjectionManager.injectPreemptiveCSS();
      this.logger.info('Phase 2.5: Preemptive CSS injected');

      // Initialize Phase 4: Substitution Manager
      this.substitutionManager = new SubstitutionManager(this.siteConfig, { debug: true });
      this.logger.info('Phase 4: Substitution Manager initialized');

      // Initialize standard modules
      this.filterCore = new FilterCore(this.keywords, { debug: true });
      this.detector = new ArticleDetector(this.siteConfig, { debug: true });
      this.observer = new OptimizedObserver(this, { debug: true });
      this.domManipulator = new DOMManipulator({ debug: true });
      this.storageManager = new StorageManager({ debug: true });
      this.messagingHandler = new MessagingHandler(this, { debug: true });

      await this.loadSettings();
      this.scanAndFilter();
      this.observer.setup();
      this.messagingHandler.setupListeners();

      this.logger.info('Initialization complete - v5.0.0 ready');
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

  scanAndFilter() {
    if (!this.isEnabled || this.keywords.length === 0) {
      this.logger.log('Filtering disabled or no keywords set');
      return;
    }

    this.logger.log(`Scanning with keywords: ${this.keywords.join(', ')}`);

    const articles = this.detector.findArticles(document);
    const headlines = this.detector.findHeadlines(document);

    this.logger.log(`Found ${articles.length} articles and ${headlines.length} headlines`);

    // Initialize substitution pool
    if (this.substitutionManager) {
      this.substitutionManager.initializePool([...articles, ...headlines]);
      this.logger.info('Phase 4: Replacement pool initialized');
    }

    let filteredCount = 0;
    const allElements = [...articles, ...headlines];

    allElements.forEach(element => {
      if (!this.detector.isProcessed(element)) {
        const matchedKeyword = this.filterCore.shouldFilter(element);
        if (matchedKeyword) {
          this.applyFilter(element, matchedKeyword);
          filteredCount++;
        } else {
          if (this.cssInjectionManager) {
            this.cssInjectionManager.markAsSafe(element);
          }
        }
        this.detector.markAsProcessed(element);
      }
    });

    // Phase 2.5: Clean up preemptive CSS
    if (this.cssInjectionManager) {
      this.cssInjectionManager.cleanupPreemptiveCSS();
      this.cssInjectionManager.injectCleanupCSS();
      this.logger.info('Phase 2.5: Preemptive CSS cleaned up');
    }

    this.filteredCount = filteredCount;
    this.updatePopupCount();
    this.logger.log(`Filtered ${filteredCount} articles`);
  }

  scanAddedNodes(nodes) {
    if (!this.isEnabled || this.keywords.length === 0) {
      return;
    }

    let filteredCount = 0;

    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const articles = this.detector.findArticles(node);
        
        if (this.substitutionManager) {
          this.substitutionManager.addArticlesToPool(articles);
        }
        
        articles.forEach(article => {
          if (!this.detector.isProcessed(article)) {
            const matchedKeyword = this.filterCore.shouldFilter(article);
            if (matchedKeyword) {
              this.applyFilter(article, matchedKeyword);
              filteredCount++;
            }
            this.detector.markAsProcessed(article);
          }
        });
      }
    });

    if (filteredCount > 0) {
      this.filteredCount += filteredCount;
      this.updatePopupCount();
    }
  }

  async applyFilter(element, keyword) {
    try {
      // Phase 4: Try substitution first
      if (this.substitutionManager) {
        try {
          const substituted = await this.substitutionManager.substitute(element, keyword);
          if (substituted) {
            this.logger.log(`Phase 4: Substitution succeeded`);
            return;
          }
        } catch (error) {
          this.logger.warn(`Phase 4: Substitution failed: ${error.message}`);
        }
      }

      // Fallback: Apply overlay
      this.logger.log('Falling back to overlay mode');
      this.domManipulator.applyOverlay(element, keyword);
    } catch (error) {
      this.logger.error(`Failed to apply filter: ${error.message}`);
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
    this.logger.log(`Keywords set: ${this.keywords.join(', ')}`);
  }

  setEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    this.logger.log(`Filtering ${isEnabled ? 'enabled' : 'disabled'}`);
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

// Also initialize on window load as fallback
window.addEventListener('load', () => {
  if (!extensionInitialized) {
    initializeExtension();
  }
});
