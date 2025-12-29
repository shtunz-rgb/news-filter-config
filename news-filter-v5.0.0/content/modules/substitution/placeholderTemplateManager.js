/**
 * Placeholder Template Manager for Phase 4: Layout-Aware Substitution
 * Generates branded placeholder cards and skeleton loaders
 * Version: 5.0.0
 */

import { Logger } from '../../utils/logger.js';

export class PlaceholderTemplateManager {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.placeholderConfig = siteConfig.placeholder || {};
    this.defaultConfig = {
      variant: 'generic',
      backgroundColor: '#f5f5f5',
      textColor: '#333',
      borderColor: '#ddd',
      message: 'Content filtered for your preference'
    };
  }

  /**
   * Create a generic placeholder card
   * @param {string} keyword - The keyword that triggered the filter
   * @returns {Element} Placeholder element
   */
  createPlaceholder(keyword) {
    try {
      const config = { ...this.defaultConfig, ...this.placeholderConfig };
      const container = document.createElement('div');
      container.className = 'news-filter-placeholder';
      container.setAttribute('data-news-filter-placeholder', 'true');
      container.setAttribute('data-keyword', keyword);

      const styles = `
        background-color: ${config.backgroundColor};
        color: ${config.textColor};
        border: 1px solid ${config.borderColor};
        border-radius: 4px;
        padding: 20px;
        text-align: center;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      `;

      container.style.cssText = styles;

      const content = document.createElement('div');
      content.className = 'news-filter-placeholder-content';
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
          <p style="margin: 0; font-weight: 500;">${config.message}</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.7;">Keyword: <code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 2px;">${keyword}</code></p>
        </div>
      `;

      container.appendChild(content);
      this.logger.log('Generic placeholder created');
      return container;
    } catch (error) {
      this.logger.error(`Failed to create placeholder: ${error.message}`);
      return this.createFallbackPlaceholder();
    }
  }

  /**
   * Create a loading placeholder with skeleton animation
   * @param {string} keyword - The keyword that triggered the filter
   * @returns {Element} Loading placeholder element
   */
  createLoadingPlaceholder(keyword) {
    try {
      const config = { ...this.defaultConfig, ...this.placeholderConfig };
      const container = document.createElement('div');
      container.className = 'news-filter-loading-placeholder';
      container.setAttribute('data-news-filter-placeholder', 'true');
      container.setAttribute('data-keyword', keyword);

      const styles = `
        background-color: ${config.backgroundColor};
        color: ${config.textColor};
        border: 1px solid ${config.borderColor};
        border-radius: 4px;
        padding: 20px;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      container.style.cssText = styles;

      const content = document.createElement('div');
      content.className = 'news-filter-loading-content';
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 400px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <div class="news-filter-spinner" style="width: 20px; height: 20px; border: 3px solid ${config.borderColor}; border-top-color: ${config.textColor}; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="font-size: 14px;">Loading replacement content...</span>
          </div>
          <div style="font-size: 12px; opacity: 0.6;">Searching for alternative articles</div>
        </div>
      `;

      container.appendChild(content);
      
      // Add spinner animation
      this.injectSpinnerAnimation();
      
      this.logger.log('Loading placeholder created');
      return container;
    } catch (error) {
      this.logger.error(`Failed to create loading placeholder: ${error.message}`);
      return this.createFallbackPlaceholder();
    }
  }

  /**
   * Create a skeleton loader
   * @returns {Element} Skeleton loader element
   */
  createSkeletonLoader() {
    try {
      const config = { ...this.defaultConfig, ...this.placeholderConfig };
      const container = document.createElement('div');
      container.className = 'news-filter-skeleton';
      container.setAttribute('data-news-filter-placeholder', 'true');

      const styles = `
        background-color: ${config.backgroundColor};
        border: 1px solid ${config.borderColor};
        border-radius: 4px;
        padding: 20px;
        min-height: 120px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      container.style.cssText = styles;

      const skeletonHTML = `
        <div class="news-filter-skeleton-item" style="height: 20px; background: linear-gradient(90deg, ${config.borderColor} 25%, rgba(255,255,255,0.2) 50%, ${config.borderColor} 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 2px;"></div>
        <div class="news-filter-skeleton-item" style="height: 16px; background: linear-gradient(90deg, ${config.borderColor} 25%, rgba(255,255,255,0.2) 50%, ${config.borderColor} 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 2px; width: 90%;"></div>
        <div class="news-filter-skeleton-item" style="height: 16px; background: linear-gradient(90deg, ${config.borderColor} 25%, rgba(255,255,255,0.2) 50%, ${config.borderColor} 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 2px; width: 80%;"></div>
      `;

      container.innerHTML = skeletonHTML;
      
      // Inject loading animation
      this.injectLoadingAnimation();
      
      this.logger.log('Skeleton loader created');
      return container;
    } catch (error) {
      this.logger.error(`Failed to create skeleton loader: ${error.message}`);
      return this.createFallbackPlaceholder();
    }
  }

  /**
   * Create a fallback placeholder (minimal HTML)
   * @returns {Element} Fallback placeholder
   * @private
   */
  createFallbackPlaceholder() {
    try {
      const div = document.createElement('div');
      div.className = 'news-filter-placeholder-fallback';
      div.setAttribute('data-news-filter-placeholder', 'true');
      div.style.cssText = `
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
        padding: 20px;
        text-align: center;
        border-radius: 4px;
        min-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      div.textContent = 'Content filtered for your preference';
      return div;
    } catch (error) {
      this.logger.error(`Failed to create fallback placeholder: ${error.message}`);
      return document.createElement('div');
    }
  }

  /**
   * Inject spinner animation CSS
   * @private
   */
  injectSpinnerAnimation() {
    try {
      if (document.getElementById('news-filter-spinner-animation')) {
        return; // Already injected
      }

      const style = document.createElement('style');
      style.id = 'news-filter-spinner-animation';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      this.logger.error(`Failed to inject spinner animation: ${error.message}`);
    }
  }

  /**
   * Inject loading animation CSS
   * @private
   */
  injectLoadingAnimation() {
    try {
      if (document.getElementById('news-filter-loading-animation')) {
        return; // Already injected
      }

      const style = document.createElement('style');
      style.id = 'news-filter-loading-animation';
      style.textContent = `
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      this.logger.error(`Failed to inject loading animation: ${error.message}`);
    }
  }

  /**
   * Create a branded placeholder with site-specific styling
   * @param {string} keyword - The keyword that triggered the filter
   * @returns {Element} Branded placeholder
   */
  createBrandedPlaceholder(keyword) {
    try {
      const config = { ...this.defaultConfig, ...this.placeholderConfig };
      
      // Detect site and apply brand colors
      const hostname = window.location.hostname;
      const brandColors = this.getBrandColors(hostname);

      const container = document.createElement('div');
      container.className = 'news-filter-branded-placeholder';
      container.setAttribute('data-news-filter-placeholder', 'true');

      const styles = `
        background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
        color: ${brandColors.textColor};
        border-radius: 8px;
        padding: 24px;
        text-align: center;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;

      container.style.cssText = styles;

      const content = document.createElement('div');
      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${config.message}</h3>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">This story was filtered based on your preferences</p>
        </div>
      `;

      container.appendChild(content);
      this.logger.log('Branded placeholder created');
      return container;
    } catch (error) {
      this.logger.error(`Failed to create branded placeholder: ${error.message}`);
      return this.createFallbackPlaceholder();
    }
  }

  /**
   * Get brand colors for a site
   * @param {string} hostname - The site hostname
   * @returns {object} Brand colors object
   * @private
   */
  getBrandColors(hostname) {
    const brandMap = {
      'cnn.com': { primary: '#CC0000', secondary: '#333333', textColor: '#FFFFFF' },
      'bbc.com': { primary: '#000000', secondary: '#222222', textColor: '#FFFFFF' },
      'bbc.co.uk': { primary: '#000000', secondary: '#222222', textColor: '#FFFFFF' },
      'yahoo.com': { primary: '#7B0099', secondary: '#6B5B95', textColor: '#FFFFFF' },
      'theguardian.com': { primary: '#0084C6', secondary: '#6B6B6B', textColor: '#FFFFFF' },
      'nytimes.com': { primary: '#111111', secondary: '#333333', textColor: '#FFFFFF' },
      'default': { primary: '#4A90E2', secondary: '#357ABD', textColor: '#FFFFFF' }
    };

    return brandMap[hostname] || brandMap['default'];
  }

  /**
   * Get placeholder configuration
   * @returns {object} Current placeholder configuration
   */
  getConfig() {
    return { ...this.defaultConfig, ...this.placeholderConfig };
  }

  /**
   * Update placeholder configuration
   * @param {object} config - New configuration
   */
  updateConfig(config) {
    this.placeholderConfig = { ...this.placeholderConfig, ...config };
    this.logger.log('Placeholder configuration updated');
  }
}
