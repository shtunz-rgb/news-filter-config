/**
 * Section Articles Fetcher
 * v6.2.0 - Handles fetching and caching of section articles from multiple news sites
 * 
 * Supports: CNN, BBC, Yahoo News, Ynet, etc.
 */

class SectionArticlesFetcher {
  constructor() {
    this.cache = {};
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache
    this.extractors = {
      cnn: CNNExtractor,
      bbc: BBCExtractor,
      ynet: YnetExtractor,
      yahoo: YahooExtractor
      // More extractors can be added here
    };
    this.sectionConfigs = {
      cnn: CNN_SECTIONS,
      bbc: BBC_SECTIONS,
      ynet: YNET_SECTIONS,
      yahoo: YAHOO_SECTIONS
      // More section configs can be added here
    };
  }

  /**
   * Fetch articles from a section on the current news site
   * @param {string} sectionKey - The section key (e.g., 'sport', 'world')
   * @param {string} siteKey - The site key (e.g., 'cnn', 'bbc')
   * @returns {Promise<Array>} Promise resolving to array of articles
   */
  async fetchSectionArticles(sectionKey, siteKey) {
    try {
      // Validate site is supported
      if (!this.extractors[siteKey]) {
        throw new Error(`Site not supported: ${siteKey}`);
      }

      // Check if we have cached data
      const cacheKey = `${siteKey}:${sectionKey}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[Fetcher v6.2.5] Returning cached articles for ' + cacheKey);
        return cached;
      }

      // Get section configuration for this site
      const sectionConfig = this.sectionConfigs[siteKey];
      if (!sectionConfig) {
        throw new Error(`No section config for site: ${siteKey}`);
      }

      const section = sectionConfig[sectionKey];
      if (!section) {
        throw new Error(`Unknown section: ${sectionKey}`);
      }

      console.log('[Fetcher v6.2.5] Fetching ' + siteKey + ' ' + sectionKey);

      // Fetch the section page
      const response = await fetch(section.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${section.name}: ${response.status}`);
      }

      const html = await response.text();
      
      // Get the appropriate extractor for this site
      const extractor = this.extractors[siteKey];
      
      // Extract articles using the site-specific extractor
      const articles = extractor.extract(html, sectionKey);
      
      // Cache the results
      this.setCache(cacheKey, articles);
      
      return articles;
    } catch (error) {
      console.error('[Fetcher v6.2.5] Error fetching articles:', error);
      throw error;
    }
  }

  /**
   * Get articles from cache
   * @param {string} cacheKey - The cache key (format: "siteKey:sectionKey")
   * @returns {Array|null} Cached articles or null if expired/not found
   */
  getFromCache(cacheKey) {
    const cached = this.cache[cacheKey];
    if (!cached) return null;

    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      delete this.cache[cacheKey];
      return null;
    }

    return cached.articles;
  }

  /**
   * Set cache for section articles
   * @param {string} cacheKey - The cache key
   * @param {Array} articles - Array of articles
   */
  setCache(cacheKey, articles) {
    this.cache[cacheKey] = {
      articles: articles,
      timestamp: Date.now()
    };
  }

  /**
   * Clear cache for a section or site
   * @param {string} cacheKey - The cache key or 'all' to clear all
   */
  clearCache(cacheKey = 'all') {
    if (cacheKey === 'all') {
      this.cache = {};
    } else {
      delete this.cache[cacheKey];
    }
  }

  /**
   * Get all available sections for a site
   * @param {string} siteKey - The site key
   * @returns {Array} Array of section objects with name and key
   */
  getAllSections(siteKey) {
    const sectionConfig = this.sectionConfigs[siteKey];
    if (!sectionConfig) return [];
    
    return Object.entries(sectionConfig).map(([key, section]) => ({
      key: key,
      name: section.name
    }));
  }
}

// Create global instance
const sectionFetcher = new SectionArticlesFetcher();
