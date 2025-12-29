/**
 * Replacement Pool for Phase 4: Layout-Aware Substitution
 * Manages a dynamic pool of safe (non-filtered) articles for substitution
 * Version: 5.0.0
 */

import { Logger } from '../../utils/logger.js';
import { extractURL } from '../../utils/dom.js';

export class ReplacementPool {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.pool = [];
    this.usedArticles = new Set();
    this.articleURLs = new Set(); // For de-duplication
    this.maxPoolSize = siteConfig.substitution?.maxPoolSize || 50;
    this.poolDepletionThreshold = 5; // Warn when pool drops below this
  }

  /**
   * Add articles to the replacement pool
   * @param {Element[]} elements - Array of article elements
   * @returns {number} Number of articles added
   */
  addArticles(elements) {
    if (!Array.isArray(elements)) {
      return 0;
    }

    let addedCount = 0;

    elements.forEach(element => {
      if (!element || !this.isValidArticle(element)) {
        return;
      }

      // De-duplicate by URL
      const url = extractURL(element);
      if (url && this.articleURLs.has(url)) {
        this.logger.log(`Skipping duplicate article: ${url}`);
        return;
      }

      // Check pool size
      if (this.pool.length >= this.maxPoolSize) {
        this.logger.log(`Pool at max size (${this.maxPoolSize}), removing oldest entry`);
        this.pool.shift();
      }

      // Add to pool
      const article = {
        element: element,
        url: url,
        addedAt: Date.now(),
        used: false
      };

      this.pool.push(article);
      if (url) {
        this.articleURLs.add(url);
      }
      addedCount++;
    });

    if (addedCount > 0) {
      this.logger.log(`Added ${addedCount} articles to pool (total: ${this.pool.length})`);
      this.checkPoolDepletion();
    }

    return addedCount;
  }

  /**
   * Get a compatible replacement from the pool
   * @param {Element} filteredElement - The filtered article element
   * @param {LayoutValidator} validator - Layout validator instance
   * @returns {Element|null} Compatible replacement element or null
   */
  getCompatibleReplacement(filteredElement, validator) {
    if (!filteredElement || !validator) {
      return null;
    }

    try {
      // Find first compatible, unused article
      for (let i = 0; i < this.pool.length; i++) {
        const article = this.pool[i];

        // Skip if already used
        if (article.used || this.usedArticles.has(article.element)) {
          continue;
        }

        // Check compatibility
        if (validator.isCompatible(filteredElement, article.element)) {
          this.logger.log(`Found compatible replacement at pool index ${i}`);
          return article.element;
        }
      }

      this.logger.log('No compatible replacement found in pool');
      return null;
    } catch (error) {
      this.logger.error(`Failed to get replacement: ${error.message}`);
      return null;
    }
  }

  /**
   * Mark an article as used (to prevent visual duplication)
   * @param {Element} element - The element to mark as used
   * @returns {boolean} True if marked successfully
   */
  markAsUsed(element) {
    if (!element) {
      return false;
    }

    try {
      this.usedArticles.add(element);
      
      // Also mark in pool
      const poolEntry = this.pool.find(article => article.element === element);
      if (poolEntry) {
        poolEntry.used = true;
        element.setAttribute('data-replacement-used', 'true');
      }

      this.logger.log('Article marked as used');
      this.checkPoolDepletion();
      return true;
    } catch (error) {
      this.logger.error(`Failed to mark article as used: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if an article is already used
   * @param {Element} element - The element to check
   * @returns {boolean} True if used
   */
  isUsed(element) {
    if (!element) {
      return false;
    }
    return this.usedArticles.has(element) || element.hasAttribute('data-replacement-used');
  }

  /**
   * Get the number of available (unused) articles in the pool
   * @returns {number} Number of available articles
   */
  getAvailableCount() {
    return this.pool.filter(article => !article.used && !this.usedArticles.has(article.element)).length;
  }

  /**
   * Get total pool size
   * @returns {number} Total articles in pool
   */
  getPoolSize() {
    return this.pool.length;
  }

  /**
   * Check if the pool is depleted
   * @returns {boolean} True if pool is empty or nearly empty
   */
  isDepleted() {
    const available = this.getAvailableCount();
    return available === 0;
  }

  /**
   * Check if pool is running low
   * @returns {boolean} True if available articles below threshold
   */
  isLow() {
    const available = this.getAvailableCount();
    return available < this.poolDepletionThreshold;
  }

  /**
   * Check pool depletion and log warnings
   * @private
   */
  checkPoolDepletion() {
    const available = this.getAvailableCount();
    
    if (available === 0) {
      this.logger.warn('Replacement pool is EMPTY - will need to use external feeds');
    } else if (available < this.poolDepletionThreshold) {
      this.logger.warn(`Replacement pool running low (${available} available)`);
    }
  }

  /**
   * Validate if an element is a suitable article
   * @param {Element} element - The element to validate
   * @returns {boolean} True if valid
   * @private
   */
  isValidArticle(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    // Check if element has content
    if (!element.textContent || element.textContent.trim().length < 10) {
      return false;
    }

    // Check if element is visible
    try {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return false;
      }
    } catch (error) {
      return false;
    }

    return true;
  }

  /**
   * Clear the entire pool
   */
  clearPool() {
    this.pool = [];
    this.usedArticles.clear();
    this.articleURLs.clear();
    this.logger.log('Replacement pool cleared');
  }

  /**
   * Remove articles that are no longer in the DOM
   */
  removeDetachedArticles() {
    try {
      const initialSize = this.pool.length;
      
      this.pool = this.pool.filter(article => {
        // Check if element is still in DOM
        if (!document.contains(article.element)) {
          this.usedArticles.delete(article.element);
          if (article.url) {
            this.articleURLs.delete(article.url);
          }
          return false;
        }
        return true;
      });

      const removed = initialSize - this.pool.length;
      if (removed > 0) {
        this.logger.log(`Removed ${removed} detached articles from pool`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove detached articles: ${error.message}`);
    }
  }

  /**
   * Get pool statistics
   * @returns {object} Pool stats
   */
  getStats() {
    return {
      total: this.pool.length,
      available: this.getAvailableCount(),
      used: this.usedArticles.size,
      maxSize: this.maxPoolSize,
      depleted: this.isDepleted(),
      low: this.isLow()
    };
  }

  /**
   * Log pool status for debugging
   */
  logStatus() {
    const stats = this.getStats();
    this.logger.log(`Pool Status: ${stats.available}/${stats.total} available (${stats.used} used, max: ${stats.maxSize})`);
  }
}
