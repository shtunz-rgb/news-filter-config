/**
 * News Filter Extension v5.0.0
 * Main entry point that orchestrates all modules
 * 
 * Phase 4: Layout-Aware Substitution System
 * Phase 2.5: Pre-emptive CSS Injection
 * 
 * Architecture:
 * - SelectorEngine: Pre-compiles CSS selectors for performance
 * - FilterCore: Handles keyword matching logic
 * - ArticleDetector: Finds article elements on the page
 * - OptimizedObserver: Monitors DOM changes and processes new nodes
 * - DOMManipulator: Creates and manages overlays
 * - StorageManager: Handles Chrome storage API
 * - MessagingHandler: Manages communication with popup/background
 * - CSSInjectionManager: Pre-emptive CSS injection (Phase 2.5)
 * - SubstitutionManager: Layout-aware substitution (Phase 4)
 */

import { SelectorEngine } from './modules/selector/engine.js';
import { FilterCore } from './modules/filter/core.js';
import { ArticleDetector } from './modules/filter/detector.js';
import { OptimizedObserver } from './modules/dom/observer.js';
import { DOMManipulator } from './modules/dom/manipulator.js';
import { StorageManager } from './modules/storage/manager.js';
import { MessagingHandler } from './modules/messaging/handler.js';
import { CSSInjectionManager } from './modules/css/cssInjectionManager.js';
import { SubstitutionManager } from './modules/substitution/substitutionManager.js';
import { getSiteConfig } from './modules/config/siteStrategies.js';
import { DEFAULT_CONFIG } from './modules/config/defaults.js';
import { Logger } from './utils/logger.js';

class NewsFilterExtension {
  constructor() {
    this.logger = new Logger(DEFAULT_CONFIG.DEBUG);
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
    
    // Phase 2.5: CSS Injection Manager
    this.cssInjectionManager = null;
    
    // Phase 4: Substitution Manager
    this.substitutionManager = null;
    
    this.logger.info('Initializing News Filter Extension v5.0.0');
    this.init();
  }

  /**
   * Initialize the extension
   */
  async init() {
    try {
      // Get site configuration
      const hostname = window.location.hostname;
      this.siteConfig = getSiteConfig(hostname);
      this.logger.log(`Using config for: ${hostname}`);

      // Initialize Phase 2.5: CSS Injection Manager
      this.cssInjectionManager = new CSSInjectionManager(this.siteConfig, { debug: DEFAULT_CONFIG.DEBUG });
      
      // Inject preemptive CSS to prevent "flash of content"
      this.cssInjectionManager.injectPreemptiveCSS();
      this.logger.log('Phase 2.5: Preemptive CSS injected');

      // Initialize Phase 4: Substitution Manager
      this.substitutionManager = new SubstitutionManager(this.siteConfig, { debug: DEFAULT_CONFIG.DEBUG });
      this.logger.log('Phase 4: Substitution Manager initialized');

      // Initialize standard modules
      this.selectorEngine = new SelectorEngine(this.siteConfig, { debug: DEFAULT_CONFIG.DEBUG });
      this.filterCore = new FilterCore(this.keywords, { debug: DEFAULT_CONFIG.DEBUG });
      this.detector = new ArticleDetector(this.selectorEngine, { debug: DEFAULT_CONFIG.DEBUG });
      this.observer = new OptimizedObserver(this, { debug: DEFAULT_CONFIG.DEBUG });
      this.domManipulator = new DOMManipulator({ debug: DEFAULT_CONFIG.DEBUG });
      this.storageManager = new StorageManager({ debug: DEFAULT_CONFIG.DEBUG });
      this.messagingHandler = new MessagingHandler(this, { debug: DEFAULT_CONFIG.DEBUG });

      // Load keywords and settings from storage
      await this.loadSettings();

      // Perform initial scan
      this.scanAndFilter();

      // Set up observer for dynamic content
      this.observer.setup();

      // Set up messaging
      this.messagingHandler.setupListeners();

      this.logger.info('Initialization complete - v5.0.0 ready');
    } catch (error) {
      this.logger.error(`Initialization failed: ${error.message}`);
    }
  }

  /**
   * Load keywords and settings from storage
   */
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

  /**
   * Scan the page and filter articles
   * Phase 4: Uses layout-aware substitution
   * Phase 2.5: Cleans up preemptive CSS after scan
   */
  scanAndFilter() {
    if (!this.isEnabled || this.keywords.length === 0) {
      this.logger.log('Filtering disabled or no keywords set');
      return;
    }

    this.logger.log(`Scanning with keywords: ${this.keywords.join(', ')}`);

    // Find all articles
    const articles = this.detector.findArticles(document);
    const headlines = this.detector.findHeadlines(document);

    this.logger.log(`Found ${articles.length} articles and ${headlines.length} headlines`);

    // Initialize substitution pool with all articles
    if (this.substitutionManager) {
      this.substitutionManager.initializePool([...articles, ...headlines]);
      this.logger.log('Phase 4: Replacement pool initialized');
    }

    // Filter articles
    let filteredCount = 0;
    const allElements = [...articles, ...headlines];

    allElements.forEach(element => {
      if (!this.detector.isProcessed(element)) {
        const matchedKeyword = this.filterCore.shouldFilter(element);
        if (matchedKeyword) {
          this.applyFilter(element, matchedKeyword);
          filteredCount++;
        } else {
          // Mark safe articles for CSS cleanup
          if (this.cssInjectionManager) {
            this.cssInjectionManager.markAsSafe(element);
          }
        }
        this.detector.markAsProcessed(element);
      }
    });

    // Phase 2.5: Clean up preemptive CSS after scan
    if (this.cssInjectionManager) {
      this.cssInjectionManager.cleanupPreemptiveCSS();
      this.cssInjectionManager.injectCleanupCSS();
      this.logger.log('Phase 2.5: Preemptive CSS cleaned up');
    }

    this.filteredCount = filteredCount;
    this.updatePopupCount();
    this.logger.log(`Filtered ${filteredCount} articles`);
  }

  /**
   * Scan newly added nodes
   * V2.5 OPTIMIZATION: Only process new nodes instead of entire page
   * Phase 4: Uses layout-aware substitution for new nodes
   * @param {array} nodes - Array of newly added DOM nodes
   */
  scanAddedNodes(nodes) {
    if (!this.isEnabled || this.keywords.length === 0) {
      return;
    }

    this.logger.log(`Scanning ${nodes.length} newly added nodes`);

    let filteredCount = 0;

    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Check if node itself is an article
        const articles = this.detector.findArticlesInNode(node);
        
        // Add new articles to substitution pool
        if (this.substitutionManager) {
          this.substitutionManager.addArticlesToPool(articles);
        }
        
        articles.forEach(article => {
          if (!this.detector.isProcessed(article)) {
            const matchedKeyword = this.filterCore.shouldFilter(article);
            if (matchedKeyword) {
              this.applyFilter(article, matchedKeyword);
              filteredCount++;
            } else {
              if (this.cssInjectionManager) {
                this.cssInjectionManager.markAsSafe(article);
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

  /**
   * Apply filter to an element
   * Phase 4: Try layout-aware substitution first
   * Fallback: Use red overlay (for compatibility)
   * @param {Element} element - The element to filter
   * @param {string} keyword - The keyword that triggered the filter
   */
  async applyFilter(element, keyword) {
    try {
      // Phase 4: Try substitution first
      if (this.substitutionManager) {
        try {
          const substituted = await this.substitutionManager.substitute(element, keyword);
          if (substituted) {
            this.logger.log(`Phase 4: Substitution succeeded for element`);
            this.trackFilteredArticle(element, keyword);
            return;
          }
        } catch (error) {
          this.logger.warn(`Phase 4: Substitution failed: ${error.message}`);
        }
      }

      // Fallback: Apply overlay (red box)
      this.logger.log('Falling back to overlay mode');
      this.domManipulator.applyOverlay(element, keyword);
      this.trackFilteredArticle(element, keyword);
    } catch (error) {
      this.logger.error(`Failed to apply filter: ${error.message}`);
    }
  }

  /**
   * Track a filtered article for the drawer
   * @param {Element} element - The article element
   * @param {string} keyword - The keyword that triggered the filter
   */
  trackFilteredArticle(element, keyword) {
    try {
      const title = this.extractArticleTitle(element);
      const url = this.extractArticleURL(element);

      // Skip if no valid title or URL
      if (!title || !url) {
        this.logger.log('Skipping tracking - no valid title or URL');
        return;
      }

      // Create article object
      const article = {
        title: title,
        keyword: keyword,
        url: url,
        timestamp: Date.now(),
        site: window.location.hostname,
        position: this.getElementPosition(element)
      };

      // Queue for storage
      this.storageManager.queueArticle(article);
    } catch (error) {
      this.logger.error(`Failed to track article: ${error.message}`);
    }
  }

  /**
   * Extract article title from element
   * @param {Element} element - The article element
   * @returns {string} The article title
   */
  extractArticleTitle(element) {
    try {
      // Try to find headline
      const headline = element.querySelector('h1, h2, h3, h4, [class*="headline"], [class*="title"]');
      if (headline && headline.textContent.trim()) {
        return headline.textContent.trim();
      }

      // Fall back to text content
      const text = element.textContent.trim();
      if (text && text.length > 15) {
        return text.substring(0, 100);
      }

      return 'Untitled Article';
    } catch (error) {
      return 'Untitled Article';
    }
  }

  /**
   * Extract article URL from element
   * @param {Element} element - The article element
   * @returns {string|null} The article URL or null
   */
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

  /**
   * Get the position of an element on the page
   * @param {Element} element - The element
   * @returns {number} Absolute position from top
   */
  getElementPosition(element) {
    try {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      return rect.top + scrollTop;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Update the popup with the current filtered count
   */
  updatePopupCount() {
    try {
      this.messagingHandler.sendToPopup({
        action: 'updateFilterCount',
        count: this.filteredCount
      }).catch(() => {
        // Popup not open, ignore
      });
    } catch (error) {
      this.logger.error(`Failed to update popup count: ${error.message}`);
    }
  }

  /**
   * Set keywords (called from popup)
   * @param {array} keywords - Array of keywords
   */
  setKeywords(keywords) {
    this.keywords = keywords || [];
    this.filterCore.setKeywords(this.keywords);
    this.logger.log(`Keywords set: ${this.keywords.join(', ')}`);
  }

  /**
   * Set enabled state (called from popup)
   * @param {boolean} isEnabled - Whether filtering is enabled
   */
  setEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    this.logger.log(`Filtering ${isEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear all overlays
   */
  clearAllOverlays() {
    this.domManipulator.clearAllOverlays();
    this.filteredCount = 0;
  }
}

/**
 * Initialize the extension when DOM is ready
 */
function initializeExtension() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new NewsFilterExtension();
    });
  } else {
    new NewsFilterExtension();
  }
}

// Initialize immediately
initializeExtension();

// Also initialize on window load as fallback
window.addEventListener('load', () => {
  // Extension should already be initialized, but this is a safety measure
  if (!window.newsFilterExtension) {
    new NewsFilterExtension();
  }
});
