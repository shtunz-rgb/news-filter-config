/**
 * DOM manipulator for the News Filter extension
 * Handles creation and removal of overlays and UI elements
 * Version: 2.3
 */

import { Logger } from '../../utils/logger.js';

export class DOMManipulator {
  constructor(options = {}) {
    this.logger = new Logger(options.debug);
  }

  /**
   * Apply an overlay to a filtered article element
   * @param {Element} element - The article element
   * @param {string} keyword - The keyword that triggered the filter
   * @returns {boolean} True if overlay was applied successfully
   */
  applyOverlay(element, keyword) {
    if (!element) return false;

    try {
      // Check if already has overlay
      if (element.hasAttribute('data-news-filtered')) {
        this.logger.log(`Element already has overlay for keyword: ${keyword}`);
        return false;
      }

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'news-filter-overlay';
      overlay.setAttribute('data-keyword', keyword);
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 0, 0, 0.3);
        border: 2px solid red;
        z-index: 10000;
        pointer-events: none;
      `;

      // Create label
      const label = document.createElement('div');
      label.className = 'news-filter-label';
      label.textContent = `Filtered: ${keyword}`;
      label.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: red;
        color: white;
        padding: 2px 5px;
        border-radius: 3px;
        font-weight: bold;
        z-index: 10001;
        font-family: Arial, sans-serif;
        font-size: 12px;
      `;

      overlay.appendChild(label);
      element.style.position = 'relative';
      element.appendChild(overlay);
      element.setAttribute('data-news-filtered', keyword);

      this.logger.log(`Applied overlay to element for keyword: ${keyword}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to apply overlay: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove an overlay from an element
   * @param {Element} element - The element
   * @returns {boolean} True if overlay was removed
   */
  removeOverlay(element) {
    if (!element) return false;

    try {
      const overlay = element.querySelector('.news-filter-overlay');
      if (overlay) {
        overlay.remove();
        element.removeAttribute('data-news-filtered');
        this.logger.log('Removed overlay from element');
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to remove overlay: ${error.message}`);
      return false;
    }
  }

  /**
   * Hide an element completely
   * @param {Element} element - The element to hide
   * @returns {boolean} True if element was hidden
   */
  hideElement(element) {
    if (!element) return false;

    try {
      element.style.display = 'none';
      element.setAttribute('data-news-filtered', 'hidden');
      this.logger.log('Hidden element');
      return true;
    } catch (error) {
      this.logger.error(`Failed to hide element: ${error.message}`);
      return false;
    }
  }

  /**
   * Show a hidden element
   * @param {Element} element - The element to show
   * @returns {boolean} True if element was shown
   */
  showElement(element) {
    if (!element) return false;

    try {
      element.style.display = '';
      element.removeAttribute('data-news-filtered');
      this.logger.log('Showed element');
      return true;
    } catch (error) {
      this.logger.error(`Failed to show element: ${error.message}`);
      return false;
    }
  }

  /**
   * Clear all overlays from the page
   * @returns {number} Number of overlays removed
   */
  clearAllOverlays() {
    try {
      const overlays = document.querySelectorAll('.news-filter-overlay');
      let count = 0;

      overlays.forEach((overlay) => {
        const parent = overlay.parentElement;
        if (parent) {
          parent.removeAttribute('data-news-filtered');
          overlay.remove();
          count++;
        }
      });

      this.logger.log(`Cleared ${count} overlays`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to clear overlays: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get all filtered elements on the page
   * @returns {array} Array of filtered elements
   */
  getFilteredElements() {
    try {
      return Array.from(document.querySelectorAll('[data-news-filtered]'));
    } catch (error) {
      this.logger.error(`Failed to get filtered elements: ${error.message}`);
      return [];
    }
  }

  /**
   * Get count of filtered elements on the page
   * @returns {number} Count of filtered elements
   */
  getFilteredCount() {
    try {
      return document.querySelectorAll('[data-news-filtered]').length;
    } catch (error) {
      this.logger.error(`Failed to get filtered count: ${error.message}`);
      return 0;
    }
  }

  /**
   * Check if an element is filtered
   * @param {Element} element - The element to check
   * @returns {boolean} True if element is filtered
   */
  isFiltered(element) {
    if (!element) return false;
    return element.hasAttribute('data-news-filtered');
  }

  /**
   * Get the keyword that filtered an element
   * @param {Element} element - The element
   * @returns {string|null} The keyword or null
   */
  getFilterKeyword(element) {
    if (!element) return null;
    return element.getAttribute('data-news-filtered');
  }
}
