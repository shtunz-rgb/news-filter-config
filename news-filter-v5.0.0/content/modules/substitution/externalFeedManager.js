/**
 * External Feed Manager for Phase 4: Layout-Aware Substitution
 * Fetches replacement articles from RSS/API feeds when local pool is empty
 * Version: 5.0.0
 */

import { Logger } from '../../utils/logger.js';

export class ExternalFeedManager {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.feedConfig = siteConfig.externalFeeds || {};
    this.cache = new Map();
    this.cacheTTL = this.feedConfig.cacheTTL || 300000; // 5 minutes default
    this.requestTimeout = 5000; // 5 seconds
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
  }

  /**
   * Fetch articles from external feeds
   * @param {string} keyword - The keyword to search for
   * @param {number} count - Number of articles to fetch
   * @returns {Promise<Array>} Array of article objects
   */
  async fetchFromFeeds(keyword, count = 5) {
    try {
      // Check cache first
      const cached = this.getFromCache(keyword);
      if (cached && cached.length > 0) {
        this.logger.log(`Found ${cached.length} cached articles for keyword: ${keyword}`);
        return cached.slice(0, count);
      }

      // Check if feeds are enabled
      if (!this.feedConfig.enabled) {
        this.logger.log('External feeds disabled');
        return [];
      }

      // Get feed sources
      const sources = this.feedConfig.sources || [];
      if (sources.length === 0) {
        this.logger.log('No feed sources configured');
        return [];
      }

      // Apply rate limiting
      await this.applyRateLimit();

      // Fetch from all sources in parallel
      const results = await Promise.allSettled(
        sources.map(source => this.fetchFromSource(source, keyword))
      );

      // Combine results
      let articles = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          articles = articles.concat(result.value);
        } else if (result.status === 'rejected') {
          this.logger.warn(`Feed source ${index} failed: ${result.reason}`);
        }
      });

      // Cache the results
      if (articles.length > 0) {
        this.setCache(keyword, articles);
      }

      this.logger.log(`Fetched ${articles.length} articles from external feeds`);
      return articles.slice(0, count);
    } catch (error) {
      this.logger.error(`Failed to fetch from feeds: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch from a specific feed source
   * @param {object} source - Feed source configuration
   * @param {string} keyword - Keyword to search for
   * @returns {Promise<Array>} Array of articles
   * @private
   */
  async fetchFromSource(source, keyword) {
    try {
      if (!source || !source.type) {
        return [];
      }

      switch (source.type) {
        case 'rss':
          return await this.fetchFromRSS(source.url, keyword);
        case 'newsapi':
          return await this.fetchFromNewsAPI(source.apiKey, keyword);
        default:
          this.logger.warn(`Unknown feed source type: ${source.type}`);
          return [];
      }
    } catch (error) {
      this.logger.error(`Failed to fetch from source ${source.type}: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch from RSS feed
   * @param {string} url - RSS feed URL
   * @param {string} keyword - Keyword to search for
   * @returns {Promise<Array>} Array of articles
   * @private
   */
  async fetchFromRSS(url, keyword) {
    try {
      if (!url) {
        return [];
      }

      const response = await this.fetchWithTimeout(url, this.requestTimeout);
      const text = await response.text();
      
      // Parse RSS XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      // Check for parsing errors
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        this.logger.error('Failed to parse RSS feed');
        return [];
      }

      // Extract items
      const items = xmlDoc.getElementsByTagName('item');
      const articles = [];

      for (let i = 0; i < Math.min(items.length, 20); i++) {
        const item = items[i];
        const title = item.getElementsByTagName('title')[0]?.textContent || '';
        const link = item.getElementsByTagName('link')[0]?.textContent || '';
        const description = item.getElementsByTagName('description')[0]?.textContent || '';

        // Filter by keyword if provided
        if (keyword && !this.matchesKeyword(title + ' ' + description, keyword)) {
          continue;
        }

        articles.push({
          title: title,
          url: link,
          description: description,
          source: 'rss',
          timestamp: Date.now()
        });

        if (articles.length >= 10) {
          break;
        }
      }

      this.logger.log(`Fetched ${articles.length} articles from RSS feed`);
      return articles;
    } catch (error) {
      this.logger.error(`Failed to fetch RSS feed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch from NewsAPI
   * @param {string} apiKey - NewsAPI key
   * @param {string} keyword - Keyword to search for
   * @returns {Promise<Array>} Array of articles
   * @private
   */
  async fetchFromNewsAPI(apiKey, keyword) {
    try {
      if (!apiKey || !keyword) {
        return [];
      }

      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&sortBy=publishedAt&language=en&pageSize=10`;
      const headers = {
        'X-API-Key': apiKey
      };

      const response = await this.fetchWithTimeout(url, this.requestTimeout, { headers });
      const data = await response.json();

      if (!data.articles) {
        this.logger.log('No articles from NewsAPI');
        return [];
      }

      const articles = data.articles.map(article => ({
        title: article.title,
        url: article.url,
        description: article.description,
        image: article.urlToImage,
        source: 'newsapi',
        timestamp: Date.now()
      }));

      this.logger.log(`Fetched ${articles.length} articles from NewsAPI`);
      return articles;
    } catch (error) {
      this.logger.error(`Failed to fetch from NewsAPI: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch with timeout
   * @param {string} url - URL to fetch
   * @param {number} timeout - Timeout in milliseconds
   * @param {object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   * @private
   */
  async fetchWithTimeout(url, timeout, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check if content matches keyword
   * @param {string} content - Content to check
   * @param {string} keyword - Keyword to match
   * @returns {boolean} True if matches
   * @private
   */
  matchesKeyword(content, keyword) {
    if (!content || !keyword) {
      return true;
    }

    const contentLower = content.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    return contentLower.includes(keywordLower);
  }

  /**
   * Apply rate limiting
   * @private
   */
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Get articles from cache
   * @param {string} keyword - Cache key
   * @returns {Array|null} Cached articles or null
   * @private
   */
  getFromCache(keyword) {
    const cached = this.cache.get(keyword);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(keyword);
      return null;
    }

    return cached.articles;
  }

  /**
   * Set cache
   * @param {string} keyword - Cache key
   * @param {Array} articles - Articles to cache
   * @private
   */
  setCache(keyword, articles) {
    this.cache.set(keyword, {
      articles: articles,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.log('Feed cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL
    };
  }

  /**
   * Check if feeds are configured
   * @returns {boolean} True if feeds are configured
   */
  isConfigured() {
    return this.feedConfig.enabled && 
           this.feedConfig.sources && 
           this.feedConfig.sources.length > 0;
  }

  /**
   * Get feed configuration
   * @returns {object} Feed configuration
   */
  getConfig() {
    return { ...this.feedConfig };
  }

  /**
   * Update feed configuration
   * @param {object} config - New configuration
   */
  updateConfig(config) {
    this.feedConfig = { ...this.feedConfig, ...config };
    this.logger.log('Feed configuration updated');
  }
}
