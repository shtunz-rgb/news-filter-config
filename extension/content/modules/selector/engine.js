/**
 * Selector engine for the News Filter extension
 * Pre-compiles and optimizes CSS selectors for performance
 * Version: 2.3
 */

import { Logger } from '../../utils/logger.js';

export class SelectorEngine {
  constructor(siteConfig, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.compiledSelectors = null;
    this.headlineSelectors = null;
    this.compile();
  }

  /**
   * Pre-compile selectors on initialization
   * This is done once per page load, not on every scan
   */
  compile() {
    // Compile article selectors
    if (this.siteConfig.articleSelectors && this.siteConfig.articleSelectors.length > 0) {
      this.compiledSelectors = this.siteConfig.articleSelectors.join(', ');
    } else {
      this.compiledSelectors = 'article, .article, [role="article"]';
    }

    // Compile headline selectors
    if (this.siteConfig.headlineSelectors && this.siteConfig.headlineSelectors.length > 0) {
      this.headlineSelectors = this.siteConfig.headlineSelectors.join(', ');
    } else {
      this.headlineSelectors = 'h1, h2, h3, h4, [class*="headline"]';
    }

    this.logger.log(`Compiled ${this.siteConfig.articleSelectors.length} article selectors`);
    this.logger.log(`Compiled ${this.siteConfig.headlineSelectors.length} headline selectors`);
  }

  /**
   * Get the compiled article selectors string
   * @returns {string} CSS selectors for articles
   */
  getCompiledSelectors() {
    return this.compiledSelectors;
  }

  /**
   * Get the compiled headline selectors string
   * @returns {string} CSS selectors for headlines
   */
  getHeadlineSelectors() {
    return this.headlineSelectors;
  }

  /**
   * Get the site configuration
   * @returns {object} Site configuration object
   */
  getSiteConfig() {
    return this.siteConfig;
  }

  /**
   * Get the domain name from the site config
   * @returns {string} Domain name
   */
  getDomain() {
    return this.siteConfig.domain || 'unknown';
  }

  /**
   * Get the substitution mode for this site
   * @returns {string} Substitution mode ('replace', 'overlay', etc.)
   */
  getSubstitutionMode() {
    return this.siteConfig.substitutionMode || 'overlay';
  }

  /**
   * Check if this site supports substitution
   * @returns {boolean} True if substitution is supported
   */
  supportsSubstitution() {
    return this.siteConfig.substitutionMode === 'replace';
  }

  /**
   * Get infinite scroll selectors (if applicable)
   * @returns {array} Array of selectors for infinite scroll containers
   */
  getInfiniteScrollSelectors() {
    return this.siteConfig.infiniteScrollSelectors || [];
  }

  /**
   * Get hero article selectors (if applicable)
   * @returns {array} Array of selectors for hero/featured articles
   */
  getHeroSelectors() {
    return this.siteConfig.heroSelectors || [];
  }

  /**
   * Get validators for this site
   * @returns {array} Array of validator function names
   */
  getValidators() {
    return this.siteConfig.validators || [];
  }

  /**
   * Get the priority of this site config
   * @returns {number} Priority number (higher = more specific)
   */
  getPriority() {
    return this.siteConfig.priority || 1;
  }

  /**
   * Get notes about this site configuration
   * @returns {string} Configuration notes
   */
  getNotes() {
    return this.siteConfig.notes || '';
  }

  /**
   * Validate a selector string
   * @param {string} selector - The selector to validate
   * @returns {boolean} True if selector is valid
   */
  validateSelector(selector) {
    try {
      document.querySelector(selector);
      return true;
    } catch (e) {
      this.logger.warn(`Invalid selector: ${selector}`);
      return false;
    }
  }

  /**
   * Get statistics about the compiled selectors
   * @returns {object} Statistics object
   */
  getStatistics() {
    return {
      domain: this.getDomain(),
      articleSelectorCount: this.siteConfig.articleSelectors.length,
      headlineSelectorCount: this.siteConfig.headlineSelectors.length,
      substitutionMode: this.getSubstitutionMode(),
      priority: this.getPriority(),
      notes: this.getNotes()
    };
  }
}
