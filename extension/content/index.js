/**
 * News Filter Extension v2.3
 * Main entry point that orchestrates all modules
 * 
 * Architecture:
 * - SelectorEngine: Pre-compiles CSS selectors for performance
 * - FilterCore: Handles keyword matching logic
 * - ArticleDetector: Finds article elements on the page
 * - OptimizedObserver: Monitors DOM changes and processes new nodes
 * - DOMManipulator: Creates and manages overlays
 * - StorageManager: Handles Chrome storage API
 * - MessagingHandler: Manages communication with popup/background
 */

import { SelectorEngine } from './modules/selector/engine.js';
import { FilterCore } from './modules/filter/core.js';
import { ArticleDetector } from './modules/filter/detector.js';
import { OptimizedObserver } from './modules/dom/observer.js';
import { DOMManipulator } from './modules/dom/manipulator.js';
import { StorageManager } from './modules/storage/manager.js';
import { MessagingHandler } from './modules/messaging/handler.js';
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
    
    this.logger.info('Initializing News Filter Extension v2.3');
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

      // Initialize modules
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

      this.logger.info('Initialization complete');
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

    // Filter articles
    let filteredCount = 0;
    const allElements = [...articles, ...headlines];

    allElements.forEach(element => {
      if (!this.detector.isProcessed(element)) {
        const matchedKeyword = this.filterCore.shouldFilter(element);
        if (matchedKeyword) {
          this.applyFilter(element, matchedKeyword);
          filteredCount++;
        }
        this.detector.markAsProcessed(element);
      }
    });

    this.filteredCount = filteredCount;
    this.updatePopupCount();
    this.logger.log(`Filtered ${filteredCount} articles`);
  }

  /**
   * Scan newly added nodes
   * V2.5 OPTIMIZATION: Only process new nodes instead of entire page
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
      this.logger.log(`Filtered ${filteredCount} articles from new nodes`);
    }
  }

  /**
   * Apply filter to an element
   * @param {Element} element - The element to filter
   * @param {string} keyword - The keyword that triggered the filter
   */
  applyFilter(element, keyword) {
    try {
      // V2.3: Apply appropriate filter method based on site config
      const substitutionMode = this.siteConfig.substitutionMode;

      if (substitutionMode === 'replace') {
        // V2.6: Will implement substitution logic
        // For now, fall back to overlay
        this.domManipulator.applyOverlay(element, keyword);
      } else {
        // Apply overlay
        this.domManipulator.applyOverlay(element, keyword);
      }

      // Track the article for the drawer
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
