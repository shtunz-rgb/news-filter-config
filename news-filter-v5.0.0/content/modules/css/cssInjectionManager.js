/**
 * CSS Injection Manager for Phase 2.5: Pre-emptive CSS Injection
 * Injects CSS at document_start to hide potential articles before script execution
 * Prevents "flash of content" by hiding articles before they're rendered
 * Version: 5.0.0
 */

import { Logger } from '../../utils/logger.js';

export class CSSInjectionManager {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.injectedStyleId = 'news-filter-preemptive-css';
    this.cleanupStyleId = 'news-filter-cleanup-css';
    this.isInjected = false;
  }

  /**
   * Inject preemptive CSS to hide potential articles
   * This should be called at document_start to prevent flash of content
   */
  injectPreemptiveCSS() {
    try {
      // Check if already injected
      if (document.getElementById(this.injectedStyleId)) {
        this.logger.log('Preemptive CSS already injected');
        return;
      }

      // Generate CSS rules
      const cssRules = this.generateHideRules();

      if (!cssRules || cssRules.length === 0) {
        this.logger.log('No CSS rules to inject');
        return;
      }

      // Create and inject style element
      const style = document.createElement('style');
      style.id = this.injectedStyleId;
      style.type = 'text/css';
      style.textContent = cssRules;

      // Inject into document head as early as possible
      if (document.head) {
        document.head.insertBefore(style, document.head.firstChild);
      } else {
        // Fallback: inject into html element
        document.documentElement.insertBefore(style, document.documentElement.firstChild);
      }

      this.isInjected = true;
      this.logger.log('Preemptive CSS injected successfully');
    } catch (error) {
      this.logger.error(`Failed to inject preemptive CSS: ${error.message}`);
    }
  }

  /**
   * Generate CSS hide rules for all article selectors
   * @returns {string} CSS rules
   * @private
   */
  generateHideRules() {
    try {
      const selectors = this.siteConfig.articleSelectors || [];
      
      if (selectors.length === 0) {
        this.logger.log('No article selectors configured');
        return '';
      }

      // Create CSS rules that hide all potential articles
      // We use !important to ensure it overrides any inline styles
      const rules = selectors.map(selector => {
        // Escape special characters in selectors
        const escapedSelector = this.escapeSelector(selector);
        return `${escapedSelector} { display: none !important; visibility: hidden !important; }`;
      });

      const cssText = rules.join('\n');
      
      this.logger.log(`Generated CSS rules for ${selectors.length} selectors`);
      return cssText;
    } catch (error) {
      this.logger.error(`Failed to generate CSS rules: ${error.message}`);
      return '';
    }
  }

  /**
   * Clean up preemptive CSS after articles have been scanned
   * This reveals safe articles that weren't filtered
   */
  cleanupPreemptiveCSS() {
    try {
      const style = document.getElementById(this.injectedStyleId);
      if (style) {
        style.remove();
        this.logger.log('Preemptive CSS removed');
      }

      this.isInjected = false;
    } catch (error) {
      this.logger.error(`Failed to clean up preemptive CSS: ${error.message}`);
    }
  }

  /**
   * Inject cleanup CSS to show safe articles
   * This is called after articles have been scanned and filtered
   */
  injectCleanupCSS() {
    try {
      // Check if cleanup CSS already exists
      if (document.getElementById(this.cleanupStyleId)) {
        return;
      }

      // Create cleanup CSS that removes display: none from safe articles
      const style = document.createElement('style');
      style.id = this.cleanupStyleId;
      style.type = 'text/css';
      
      // CSS to show articles that don't have the filtered attribute
      const cssText = `
        /* Show articles that are not filtered */
        [data-news-filter-safe="true"] { 
          display: revert !important; 
          visibility: visible !important; 
        }
        
        /* Smooth transition for revealed articles */
        [data-news-filter-safe="true"] {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;

      style.textContent = cssText;
      document.head.appendChild(style);
      
      this.logger.log('Cleanup CSS injected');
    } catch (error) {
      this.logger.error(`Failed to inject cleanup CSS: ${error.message}`);
    }
  }

  /**
   * Mark an article as safe (not filtered)
   * This allows it to be shown after preemptive CSS is cleaned up
   * @param {Element} element - The article element
   */
  markAsSafe(element) {
    try {
      if (element) {
        element.setAttribute('data-news-filter-safe', 'true');
        element.style.display = '';
        element.style.visibility = '';
      }
    } catch (error) {
      this.logger.error(`Failed to mark element as safe: ${error.message}`);
    }
  }

  /**
   * Escape special characters in CSS selectors
   * @param {string} selector - CSS selector
   * @returns {string} Escaped selector
   * @private
   */
  escapeSelector(selector) {
    try {
      // CSS.escape() is the standard way to escape selectors
      if (typeof CSS !== 'undefined' && CSS.escape) {
        return CSS.escape(selector);
      }

      // Fallback: manually escape special characters
      return selector.replace(/([!"#$%&'()*+,.\/:;?@[\\\]^`{|}~])/g, '\\$1');
    } catch (error) {
      this.logger.error(`Failed to escape selector: ${error.message}`);
      return selector;
    }
  }

  /**
   * Create a stylesheet for dynamic CSS injection
   * Useful for injecting CSS rules that can be updated
   * @returns {CSSStyleSheet} The stylesheet
   */
  createDynamicStylesheet() {
    try {
      const style = document.createElement('style');
      style.id = 'news-filter-dynamic-css';
      document.head.appendChild(style);
      return style.sheet;
    } catch (error) {
      this.logger.error(`Failed to create dynamic stylesheet: ${error.message}`);
      return null;
    }
  }

  /**
   * Add a CSS rule to a stylesheet
   * @param {CSSStyleSheet} sheet - The stylesheet
   * @param {string} selector - CSS selector
   * @param {string} declaration - CSS declaration
   */
  addRule(sheet, selector, declaration) {
    try {
      if (!sheet) {
        return;
      }

      const rule = `${selector} { ${declaration} }`;
      sheet.insertRule(rule, sheet.cssRules.length);
      this.logger.log(`Added CSS rule: ${selector}`);
    } catch (error) {
      this.logger.error(`Failed to add CSS rule: ${error.message}`);
    }
  }

  /**
   * Remove a CSS rule from a stylesheet
   * @param {CSSStyleSheet} sheet - The stylesheet
   * @param {number} index - Rule index
   */
  removeRule(sheet, index) {
    try {
      if (!sheet || index < 0 || index >= sheet.cssRules.length) {
        return;
      }

      sheet.deleteRule(index);
      this.logger.log(`Removed CSS rule at index ${index}`);
    } catch (error) {
      this.logger.error(`Failed to remove CSS rule: ${error.message}`);
    }
  }

  /**
   * Get the status of CSS injection
   * @returns {object} Status object
   */
  getStatus() {
    return {
      injected: this.isInjected,
      preemptiveStyleExists: !!document.getElementById(this.injectedStyleId),
      cleanupStyleExists: !!document.getElementById(this.cleanupStyleId)
    };
  }

  /**
   * Clear all injected CSS
   */
  clearAll() {
    try {
      const preemptiveStyle = document.getElementById(this.injectedStyleId);
      if (preemptiveStyle) {
        preemptiveStyle.remove();
      }

      const cleanupStyle = document.getElementById(this.cleanupStyleId);
      if (cleanupStyle) {
        cleanupStyle.remove();
      }

      const dynamicStyle = document.getElementById('news-filter-dynamic-css');
      if (dynamicStyle) {
        dynamicStyle.remove();
      }

      this.isInjected = false;
      this.logger.log('All injected CSS cleared');
    } catch (error) {
      this.logger.error(`Failed to clear injected CSS: ${error.message}`);
    }
  }
}
