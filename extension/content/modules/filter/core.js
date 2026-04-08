/**
 * Core filtering logic for the News Filter extension
 * Handles keyword matching and content analysis
 * Version: 2.3
 */

import { Logger } from '../../utils/logger.js';
import { extractURL, getElementText } from '../../utils/dom.js';

export class FilterCore {
  constructor(keywords = [], options = {}) {
    this.keywords = keywords;
    this.options = options;
    this.logger = new Logger(options.debug);
  }

  /**
   * Determine if an element should be filtered based on keywords
   * @param {Element} element - The element to check
   * @returns {string|false} The matched keyword or false
   */
  shouldFilter(element) {
    if (!this.keywords.length) return false;
    if (!element) return false;

    const allContent = this.getElementKeywordContent(element);
    
    // Check each keyword
    for (const keyword of this.keywords) {
      if (!keyword.trim()) continue;

      const keywordLower = keyword.toLowerCase().trim();
      
      // Check if keyword contains non-ASCII characters
      const isNonASCII = /[^\x00-\x7F]/.test(keywordLower);

      // Check URL first
      const url = extractURL(element);
      if (url && this.matchesKeywordInURL(url, keywordLower, isNonASCII)) {
        this.logger.log(`Keyword match in URL: "${keyword}"`);
        return keyword;
      }

      // Then check content
      if (this.matchesKeywordInContent(allContent, keywordLower, isNonASCII)) {
        this.logger.log(`Keyword match in content: "${keyword}"`);
        return keyword;
      }
    }

    return false;
  }

  /**
   * Extract all relevant text content from an element
   * @param {Element} element - The element
   * @returns {string} Combined text content in lowercase
   */
  getElementKeywordContent(element) {
    if (!element) return '';
    
    let content = '';

    // Get headline text
    const headline = element.querySelector('h1, h2, h3, h4, [class*="headline"], [class*="title"]');
    if (headline) {
      content += headline.textContent + ' ';
    }

    // Get summary/description text
    const summary = element.querySelector('[class*="summary"], [class*="description"], p');
    if (summary) {
      content += summary.textContent + ' ';
    }

    // Get element's own text content (limited to avoid noise)
    const elementText = element.textContent;
    if (elementText) {
      content += elementText.substring(0, 500);
    }

    return content.toLowerCase();
  }

  /**
   * Check if a keyword matches in a URL
   * @param {string} url - The URL to check
   * @param {string} keywordLower - The keyword in lowercase
   * @param {boolean} isNonASCII - Whether keyword is non-ASCII
   * @returns {boolean} True if keyword matches
   */
  matchesKeywordInURL(url, keywordLower, isNonASCII) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      if (isNonASCII) {
        return pathname.includes(keywordLower);
      } else {
        const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
        return regex.test(pathname);
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if a keyword matches in content
   * @param {string} content - The content to check
   * @param {string} keywordLower - The keyword in lowercase
   * @param {boolean} isNonASCII - Whether keyword is non-ASCII
   * @returns {boolean} True if keyword matches
   */
  matchesKeywordInContent(content, keywordLower, isNonASCII) {
    if (!content) return false;

    if (isNonASCII) {
      // For non-ASCII keywords, use simple contains check
      return content.includes(keywordLower);
    } else {
      // For ASCII keywords, use word boundary matching
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
      return regex.test(content);
    }
  }

  /**
   * Set new keywords
   * @param {array} keywords - Array of keyword strings
   */
  setKeywords(keywords) {
    this.keywords = keywords || [];
    this.logger.log(`Keywords updated: ${this.keywords.join(', ')}`);
  }

  /**
   * Get current keywords
   * @returns {array} Array of keyword strings
   */
  getKeywords() {
    return [...this.keywords];
  }

  /**
   * Add a single keyword
   * @param {string} keyword - The keyword to add
   * @returns {boolean} True if added, false if already exists
   */
  addKeyword(keyword) {
    const keywordLower = keyword.toLowerCase();
    if (!this.keywords.some(k => k.toLowerCase() === keywordLower)) {
      this.keywords.push(keyword);
      return true;
    }
    return false;
  }

  /**
   * Remove a keyword
   * @param {string} keyword - The keyword to remove
   * @returns {boolean} True if removed, false if not found
   */
  removeKeyword(keyword) {
    const index = this.keywords.findIndex(k => k.toLowerCase() === keyword.toLowerCase());
    if (index !== -1) {
      this.keywords.splice(index, 1);
      return true;
    }
    return false;
  }
}
