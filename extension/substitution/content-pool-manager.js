/**
 * Content Pool Manager v7.0.0
 * Manages the pool of replacement articles fetched from various sections
 * Handles caching, fetching, and pool building for seamless substitution
 */

class ContentPoolManager {
  constructor() {
    this.version = '7.1.4';
    this.CACHE_DURATION = 3600; // 1 hour in seconds
    this.REPLACEMENT_SECTIONS = ['sports', 'business', 'entertainment']; // 3 sections for balance
    this.pool = null;
    this.lastFetchTime = null;
    // V7.1.4: Singleton pattern to prevent duplicate builds
    this.buildPromise = null; // Track ongoing build
  }

  /**
   * Get content pool for current site
   * Returns cached pool if available, otherwise fetches new pool
   */
  async getPool(site) {
    console.log(`[ContentPoolManager v${this.version}] Getting pool for ${site}`);
    
    // Check if we have a valid cached pool
    if (this.pool && this.isCacheValid()) {
      console.log(`[ContentPoolManager] Using cached pool (${this.pool.length} articles)`);
      return this.pool;
    }

    // V7.1.4: If a build is already in progress, wait for it
    if (this.buildPromise) {
      console.log(`[ContentPoolManager] Build already in progress, waiting...`);
      return this.buildPromise;
    }

    // Build new pool
    console.log(`[ContentPoolManager] Building new pool...`);
    this.buildPromise = this.buildPool(site)
      .then(pool => {
        this.pool = pool;
        this.lastFetchTime = Date.now();
        this.buildPromise = null; // Clear promise after completion
        return this.pool;
      })
      .catch(error => {
        this.buildPromise = null; // Clear promise on error
        throw error;
      });
    
    return this.buildPromise;
  }

  /**
   * Check if cached pool is still valid
   */
  isCacheValid() {
    if (!this.lastFetchTime) return false;
    const elapsed = (Date.now() - this.lastFetchTime) / 1000;
    return elapsed < this.CACHE_DURATION;
  }

  /**
   * Build content pool by fetching articles from multiple sections
   */
  async buildPool(site) {
    const pool = [];
    let successCount = 0;

    console.log(`[ContentPoolManager] Fetching from ${this.REPLACEMENT_SECTIONS.length} sections...`);

    for (const section of this.REPLACEMENT_SECTIONS) {
      try {
        console.log(`[ContentPoolManager] Fetching ${section}...`);
        const articles = await this.fetchSection(site, section);
        
        if (articles && articles.length > 0) {
          // Enrich articles with metadata
          const enriched = articles.map(article => this.enrichArticle(article, section));
          pool.push(...enriched);
          successCount++;
          console.log(`[ContentPoolManager] ✓ ${section}: ${articles.length} articles`);
        } else {
          console.warn(`[ContentPoolManager] ✗ ${section}: No articles found`);
        }
      } catch (error) {
        console.error(`[ContentPoolManager] Error fetching ${section}:`, error);
      }
    }

    console.log(`[ContentPoolManager] Pool built: ${pool.length} articles from ${successCount}/${this.REPLACEMENT_SECTIONS.length} sections`);
    
    return pool;
  }

  /**
   * Fetch articles from a specific section
   */
  async fetchSection(site, section) {
    try {
      // Send message to background script to fetch section articles
      const response = await chrome.runtime.sendMessage({
        action: 'fetchSectionArticles',
        siteKey: site,
        sectionKey: section
      });

      if (response && response.success && response.articles) {
        return response.articles;
      } else {
        console.error(`[ContentPoolManager] Failed to fetch ${section}:`, response?.error);
        return [];
      }
    } catch (error) {
      console.error(`[ContentPoolManager] Error in fetchSection:`, error);
      return [];
    }
  }

  /**
   * Enrich article with metadata for matching
   */
  enrichArticle(article, section) {
    return {
      ...article,
      section: section,
      titleLength: article.title ? article.title.length : 0,
      // Image dimensions will be calculated when needed
      // (can't access image.naturalWidth from here)
      hasImage: !!article.imageUrl,
      enrichedAt: Date.now()
    };
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  clearCache() {
    console.log(`[ContentPoolManager] Cache cleared`);
    this.pool = null;
    this.lastFetchTime = null;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    if (!this.pool) {
      return {
        size: 0,
        sections: [],
        cacheValid: false
      };
    }

    const sectionCounts = {};
    this.pool.forEach(article => {
      sectionCounts[article.section] = (sectionCounts[article.section] || 0) + 1;
    });

    return {
      size: this.pool.length,
      sections: Object.keys(sectionCounts).map(section => ({
        name: section,
        count: sectionCounts[section]
      })),
      cacheValid: this.isCacheValid(),
      cacheAge: this.lastFetchTime ? Math.floor((Date.now() - this.lastFetchTime) / 1000) : null
    };
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.ContentPoolManager = ContentPoolManager;
}
