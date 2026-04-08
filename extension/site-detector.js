/**
 * Site Detector Module
 * v6.2.4 - Detects which news website the user is currently on
 */

const SiteDetector = {
  /**
   * Detect the current news website from hostname
   * @param {string} hostname - The current page hostname
   * @returns {string|null} - Site key (cnn, bbc, yahoo, ynet) or null if not supported
   */
  detectSite(hostname) {
    console.log('[SiteDetector v6.2.4] Detecting site from hostname:', hostname);
    
    if (hostname.includes('cnn.com')) {
      return 'cnn';
    } else if (hostname.includes('bbc.com')) {
      return 'bbc';
    } else if (hostname.includes('yahoo.com')) {
      // Fixed: Yahoo.com doesn't require "news" in hostname
      return 'yahoo';
    } else if (hostname.includes('ynet.co.il')) {
      return 'ynet';
    }
    
    return null;
  },

  /**
   * Get all supported sites
   * @returns {Array} - Array of supported site keys
   */
  getSupportedSites() {
    return ['cnn', 'bbc', 'yahoo', 'ynet'];
  },

  /**
   * Check if a site is supported
   * @param {string} siteKey - The site key
   * @returns {boolean} - True if supported
   */
  isSupported(siteKey) {
    return this.getSupportedSites().includes(siteKey);
  }
};
