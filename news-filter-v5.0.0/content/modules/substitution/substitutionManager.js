/**
 * Substitution Manager for Phase 4: Layout-Aware Substitution
 * Orchestrates the entire substitution workflow with multi-tier fallback strategy
 * Version: 5.0.0
 */

import { Logger } from '../../utils/logger.js';
import { LayoutValidator } from './layoutValidator.js';
import { ReplacementPool } from './replacementPool.js';
import { PlaceholderTemplateManager } from './placeholderTemplateManager.js';
import { ExternalFeedManager } from './externalFeedManager.js';

export class SubstitutionManager {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.layoutValidator = new LayoutValidator(siteConfig, options);
    this.replacementPool = new ReplacementPool(siteConfig, options);
    this.placeholderManager = new PlaceholderTemplateManager(siteConfig, options);
    this.feedManager = new ExternalFeedManager(siteConfig, options);
    this.substitutionStats = {
      tier1: 0,
      tier2: 0,
      tier3: 0,
      tier4: 0,
      tier5: 0,
      total: 0
    };
  }

  /**
   * Attempt to substitute a filtered article
   * Tries tiers in order: 1 (Layout-Aware) → 2 (External Feed) → 3 (Placeholder) → 4 (Skeleton) → 5 (Hide)
   * @param {Element} filteredElement - The filtered article element
   * @param {string} keyword - The keyword that triggered the filter
   * @returns {Promise<boolean>} True if substitution succeeded
   */
  async substitute(filteredElement, keyword) {
    if (!filteredElement) {
      return false;
    }

    try {
      this.logger.log(`Attempting substitution for filtered article (keyword: ${keyword})`);

      // Tier 1: Layout-Aware Replacement
      if (this.executeTier1(filteredElement, keyword)) {
        this.substitutionStats.tier1++;
        this.substitutionStats.total++;
        this.logger.log('✓ Tier 1 (Layout-Aware) succeeded');
        return true;
      }

      // Tier 2: External Feed (Async)
      if (this.replacementPool.isDepleted()) {
        this.logger.log('Pool depleted, attempting Tier 2 (External Feed)');
        if (await this.executeTier2(filteredElement, keyword)) {
          this.substitutionStats.tier2++;
          this.substitutionStats.total++;
          this.logger.log('✓ Tier 2 (External Feed) succeeded');
          return true;
        }
      }

      // Tier 3: Generic Placeholder
      if (this.executeTier3(filteredElement, keyword)) {
        this.substitutionStats.tier3++;
        this.substitutionStats.total++;
        this.logger.log('✓ Tier 3 (Generic Placeholder) succeeded');
        return true;
      }

      // Tier 4: Skeleton Loader (for async content)
      if (this.executeTier4(filteredElement, keyword)) {
        this.substitutionStats.tier4++;
        this.substitutionStats.total++;
        this.logger.log('✓ Tier 4 (Skeleton Loader) succeeded');
        return true;
      }

      // Tier 5: Element Concealment (Last Resort)
      if (this.executeTier5(filteredElement)) {
        this.substitutionStats.tier5++;
        this.substitutionStats.total++;
        this.logger.log('✓ Tier 5 (Element Concealment) succeeded');
        return true;
      }

      this.logger.error('All substitution tiers failed');
      return false;
    } catch (error) {
      this.logger.error(`Substitution failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Tier 1: Layout-Aware Replacement
   * Replace with compatible article from the page
   * @private
   */
  executeTier1(filteredElement, keyword) {
    try {
      const replacement = this.replacementPool.getCompatibleReplacement(filteredElement, this.layoutValidator);
      
      if (!replacement) {
        this.logger.log('No compatible replacement in pool');
        return false;
      }

      // Clone the replacement
      const clone = this.cloneElement(replacement);
      
      // Hide the original to prevent duplication
      this.hideOriginal(replacement);
      
      // Replace the filtered element
      this.replaceElement(filteredElement, clone);
      
      // Mark as used
      this.replacementPool.markAsUsed(replacement);
      
      return true;
    } catch (error) {
      this.logger.error(`Tier 1 failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Tier 2: External Feed
   * Fetch replacement from RSS/API feeds
   * @private
   */
  async executeTier2(filteredElement, keyword) {
    try {
      const articles = await this.feedManager.fetchFromFeeds(keyword, 1);
      
      if (!articles || articles.length === 0) {
        this.logger.log('No articles from external feeds');
        return false;
      }

      // Create placeholder with loading state
      const placeholder = this.placeholderManager.createLoadingPlaceholder(keyword);
      this.replaceElement(filteredElement, placeholder);

      // Async load the feed article
      const article = articles[0];
      setTimeout(() => {
        const articleElement = this.createArticleElement(article);
        const loadingPlaceholder = filteredElement.nextElementSibling;
        if (loadingPlaceholder && loadingPlaceholder.classList.contains('news-filter-skeleton')) {
          this.replaceElement(loadingPlaceholder, articleElement);
        }
      }, 1000);

      return true;
    } catch (error) {
      this.logger.error(`Tier 2 failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Tier 3: Generic Placeholder
   * Display branded placeholder card
   * @private
   */
  executeTier3(filteredElement, keyword) {
    try {
      const placeholder = this.placeholderManager.createPlaceholder(keyword);
      this.replaceElement(filteredElement, placeholder);
      return true;
    } catch (error) {
      this.logger.error(`Tier 3 failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Tier 4: Skeleton Loader
   * Show loading animation while fetching content
   * @private
   */
  executeTier4(filteredElement, keyword) {
    try {
      const skeleton = this.placeholderManager.createSkeletonLoader();
      this.replaceElement(filteredElement, skeleton);
      return true;
    } catch (error) {
      this.logger.error(`Tier 4 failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Tier 5: Element Concealment
   * Hide element completely (last resort)
   * @private
   */
  executeTier5(filteredElement) {
    try {
      filteredElement.style.visibility = 'hidden';
      filteredElement.style.pointerEvents = 'none';
      filteredElement.setAttribute('data-news-filtered-hidden', 'true');
      return true;
    } catch (error) {
      this.logger.error(`Tier 5 failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Clone an element for replacement
   * @param {Element} element - The element to clone
   * @returns {Element} Cloned element
   * @private
   */
  cloneElement(element) {
    try {
      const clone = element.cloneNode(true);
      clone.removeAttribute('data-replacement-used');
      clone.setAttribute('data-news-filter-clone', 'true');
      return clone;
    } catch (error) {
      this.logger.error(`Failed to clone element: ${error.message}`);
      return element;
    }
  }

  /**
   * Hide the original element to prevent visual duplication
   * @param {Element} element - The element to hide
   * @private
   */
  hideOriginal(element) {
    try {
      element.style.visibility = 'hidden';
      element.style.pointerEvents = 'none';
      element.setAttribute('data-replacement-source', 'true');
      this.logger.log('Original article hidden to prevent duplication');
    } catch (error) {
      this.logger.error(`Failed to hide original: ${error.message}`);
    }
  }

  /**
   * Replace an element with another element
   * @param {Element} target - The element to replace
   * @param {Element} replacement - The replacement element
   * @private
   */
  replaceElement(target, replacement) {
    try {
      if (target.parentNode) {
        target.parentNode.replaceChild(replacement, target);
        this.logger.log('Element replaced successfully');
      }
    } catch (error) {
      this.logger.error(`Failed to replace element: ${error.message}`);
    }
  }

  /**
   * Create an article element from feed data
   * @param {object} article - Article object with title, url, image
   * @returns {Element} Article element
   * @private
   */
  createArticleElement(article) {
    try {
      const container = document.createElement('div');
      container.className = 'news-filter-feed-article';
      container.setAttribute('data-news-filter-feed', 'true');

      const html = `
        <div class="news-filter-feed-content">
          ${article.image ? `<img src="${article.image}" alt="${article.title}" class="news-filter-feed-image">` : ''}
          <h3 class="news-filter-feed-title">${article.title}</h3>
          ${article.description ? `<p class="news-filter-feed-description">${article.description}</p>` : ''}
          <a href="${article.url}" class="news-filter-feed-link" target="_blank">Read More</a>
        </div>
      `;

      container.innerHTML = html;
      return container;
    } catch (error) {
      this.logger.error(`Failed to create article element: ${error.message}`);
      return document.createElement('div');
    }
  }

  /**
   * Initialize the pool with articles from the page
   * @param {Element[]} articles - Array of article elements
   */
  initializePool(articles) {
    this.replacementPool.addArticles(articles);
    this.replacementPool.logStatus();
  }

  /**
   * Add new articles to the pool (for infinite scroll)
   * @param {Element[]} articles - Array of new article elements
   */
  addArticlesToPool(articles) {
    this.replacementPool.addArticles(articles);
  }

  /**
   * Get substitution statistics
   * @returns {object} Statistics object
   */
  getStats() {
    return {
      ...this.substitutionStats,
      poolStats: this.replacementPool.getStats()
    };
  }

  /**
   * Log substitution statistics
   */
  logStats() {
    const stats = this.getStats();
    this.logger.log(`Substitution Stats: Tier1=${stats.tier1}, Tier2=${stats.tier2}, Tier3=${stats.tier3}, Tier4=${stats.tier4}, Tier5=${stats.tier5}, Total=${stats.total}`);
    this.replacementPool.logStatus();
  }

  /**
   * Clear all resources
   */
  clear() {
    this.replacementPool.clearPool();
    this.layoutValidator.clearCache();
    this.feedManager.clearCache();
  }
}
