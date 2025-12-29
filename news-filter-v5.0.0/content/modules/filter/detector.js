/**
 * Article detection module for the News Filter extension
 * Finds and identifies article elements on the page
 * Version: 2.3
 */

import { Logger } from '../../utils/logger.js';
import { findElements, matchesSelectors } from '../../utils/dom.js';

export class ArticleDetector {
  constructor(selectorEngine, options = {}) {
    this.selectorEngine = selectorEngine;
    this.logger = new Logger(options.debug);
    this.processedElements = new WeakSet();
  }

  /**
   * Find all article elements on the page
   * @param {Document} doc - The document object
   * @returns {NodeList|array} List of article elements
   */
  findArticles(doc = document) {
    const selectors = this.selectorEngine.getCompiledSelectors();
    
    try {
      const articles = findElements(selectors, doc);
      this.logger.log(`Found ${articles.length} articles using compiled selectors`);
      return articles;
    } catch (error) {
      this.logger.error(`Error finding articles: ${error.message}`);
      return [];
    }
  }

  /**
   * Find all headline elements on the page
   * @param {Document} doc - The document object
   * @returns {NodeList|array} List of headline elements
   */
  findHeadlines(doc = document) {
    const selectors = this.selectorEngine.getHeadlineSelectors();
    
    try {
      const headlines = findElements(selectors, doc);
      this.logger.log(`Found ${headlines.length} headlines using compiled selectors`);
      return headlines;
    } catch (error) {
      this.logger.error(`Error finding headlines: ${error.message}`);
      return [];
    }
  }

  /**
   * Find articles within a specific node
   * @param {Element} node - The node to search within
   * @returns {array} Array of article elements
   */
  findArticlesInNode(node) {
    if (!node) return [];

    const articles = [];

    // Check if node itself is an article
    if (this.isArticleElement(node)) {
      articles.push(node);
    }

    // Find articles within the node
    const selectors = this.selectorEngine.getCompiledSelectors();
    try {
      const descendants = node.querySelectorAll(selectors);
      articles.push(...descendants);
    } catch (e) {
      this.logger.error(`Error finding articles in node: ${e.message}`);
    }

    return articles;
  }

  /**
   * Check if an element is an article element
   * @param {Element} node - The element to check
   * @returns {boolean} True if element matches article selectors
   */
  isArticleElement(node) {
    if (!node) return false;
    const selectors = this.selectorEngine.getCompiledSelectors();
    return matchesSelectors(node, selectors);
  }

  /**
   * Mark an element as processed to avoid re-processing
   * @param {Element} element - The element to mark
   */
  markAsProcessed(element) {
    if (element) {
      this.processedElements.add(element);
    }
  }

  /**
   * Check if an element has been processed
   * @param {Element} element - The element to check
   * @returns {boolean} True if element has been processed
   */
  isProcessed(element) {
    if (!element) return false;
    return this.processedElements.has(element);
  }

  /**
   * Clear the processed elements cache
   */
  clearProcessedCache() {
    this.processedElements = new WeakSet();
    this.logger.log('Cleared processed elements cache');
  }

  /**
   * Get the number of processed elements
   * @returns {number} Approximate count of processed elements
   */
  getProcessedCount() {
    // WeakSet doesn't have a size property, so we can't get exact count
    return 'unknown';
  }
}
