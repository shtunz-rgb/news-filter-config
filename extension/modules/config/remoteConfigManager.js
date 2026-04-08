/**
 * RemoteConfigManager - Fetches and manages remote site configurations
 * 
 * Features:
 * - Fetches configuration from remote URL
 * - Caches configuration locally for offline access
 * - Validates configuration schema
 * - Falls back to built-in defaults on error
 * - Supports manual refresh
 */

export class RemoteConfigManager {
  constructor(options = {}) {
    // Configuration URL - can be GitHub raw content, CDN, or custom server
    this.configUrl = options.configUrl || 
      'https://raw.githubusercontent.com/yourusername/news-filter-config/main/config.json';
    
    // Cache settings
    this.cacheKey = 'newsFilterRemoteConfig';
    this.cacheDuration = options.cacheDuration || 24 * 60 * 60 * 1000; // 24 hours
    
    // Network settings
    this.timeout = options.timeout || 5000; // 5 second timeout
    this.retryAttempts = options.retryAttempts || 3;
    
    // Built-in fallback config
    this.builtInConfig = null;
    
    console.log('[RemoteConfigManager] Initialized with URL:', this.configUrl);
  }
  
  /**
   * Get configuration - tries remote first, then cache, then built-in
   */
  async getConfig() {
    console.log('[RemoteConfigManager] Getting configuration...');
    
    // Try to get from cache first
    const cached = await this.getCachedConfig();
    if (cached && !this.isCacheExpired(cached)) {
      console.log('[RemoteConfigManager] Using cached configuration (v' + cached.version + ')');
      return cached.config;
    }
    
    // Try to fetch from remote
    try {
      const config = await this.fetchRemoteConfig();
      
      // Validate the configuration
      if (!this.validateConfig(config)) {
        throw new Error('Invalid configuration format');
      }
      
      // Cache the configuration
      await this.cacheConfig(config);
      console.log('[RemoteConfigManager] Fetched and cached new configuration (v' + config.version + ')');
      return config;
    } catch (error) {
      console.error('[RemoteConfigManager] Failed to fetch remote config:', error.message);
      
      // Fall back to cached version if available
      if (cached) {
        console.log('[RemoteConfigManager] Using stale cached configuration (v' + cached.version + ')');
        return cached.config;
      }
      
      // Fall back to built-in defaults
      console.log('[RemoteConfigManager] Using built-in default configuration');
      return this.getBuiltInConfig();
    }
  }
  
  /**
   * Fetch configuration from remote URL with retry logic
   */
  async fetchRemoteConfig(attempt = 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      console.log('[RemoteConfigManager] Fetching from:', this.configUrl);
      
      const response = await fetch(this.configUrl, {
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const config = await response.json();
      console.log('[RemoteConfigManager] Successfully fetched configuration');
      return config;
    } catch (error) {
      // Retry logic
      if (attempt < this.retryAttempts) {
        console.log('[RemoteConfigManager] Retry attempt', attempt + 1, 'of', this.retryAttempts);
        await this.sleep(1000 * attempt); // Exponential backoff
        return this.fetchRemoteConfig(attempt + 1);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Get cached configuration from Chrome storage
   */
  async getCachedConfig() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([this.cacheKey], (result) => {
          if (chrome.runtime.lastError) {
            console.error('[RemoteConfigManager] Cache read error:', chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(result[this.cacheKey] || null);
          }
        });
      } catch (error) {
        console.error('[RemoteConfigManager] Cache access error:', error);
        resolve(null);
      }
    });
  }
  
  /**
   * Cache configuration to Chrome storage
   */
  async cacheConfig(config) {
    const cacheData = {
      config: config,
      timestamp: Date.now(),
      version: config.version
    };
    
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [this.cacheKey]: cacheData }, () => {
          if (chrome.runtime.lastError) {
            console.error('[RemoteConfigManager] Cache write error:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            console.log('[RemoteConfigManager] Configuration cached successfully');
            resolve();
          }
        });
      } catch (error) {
        console.error('[RemoteConfigManager] Cache write error:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Check if cache has expired
   */
  isCacheExpired(cached) {
    if (!cached || !cached.timestamp) {
      return true;
    }
    
    const age = Date.now() - cached.timestamp;
    const expired = age > this.cacheDuration;
    
    if (expired) {
      console.log('[RemoteConfigManager] Cache expired (age:', Math.round(age / 1000 / 60), 'minutes)');
    }
    
    return expired;
  }
  
  /**
   * Validate configuration schema
   */
  validateConfig(config) {
    try {
      // Check required top-level fields
      if (!config.version || typeof config.version !== 'string') {
        console.error('[RemoteConfigManager] Missing or invalid version');
        return false;
      }
      
      if (!config.sites || typeof config.sites !== 'object') {
        console.error('[RemoteConfigManager] Missing or invalid sites object');
        return false;
      }
      
      // Validate each site configuration
      for (const [domain, siteConfig] of Object.entries(config.sites)) {
        // Check articleSelectors
        if (!Array.isArray(siteConfig.articleSelectors) || 
            siteConfig.articleSelectors.length === 0) {
          console.error('[RemoteConfigManager] Site', domain, 'missing or empty articleSelectors');
          return false;
        }
        
        // Check headlineSelectors
        if (!Array.isArray(siteConfig.headlineSelectors) || 
            siteConfig.headlineSelectors.length === 0) {
          console.error('[RemoteConfigManager] Site', domain, 'missing or empty headlineSelectors');
          return false;
        }
        
        // Check enabled flag
        if (typeof siteConfig.enabled !== 'boolean') {
          console.error('[RemoteConfigManager] Site', domain, 'missing enabled flag');
          return false;
        }
      }
      
      // Validate fallback configuration
      if (config.fallback) {
        if (!Array.isArray(config.fallback.articleSelectors) || 
            config.fallback.articleSelectors.length === 0) {
          console.error('[RemoteConfigManager] Fallback missing or empty articleSelectors');
          return false;
        }
      }
      
      console.log('[RemoteConfigManager] Configuration validation passed');
      return true;
    } catch (error) {
      console.error('[RemoteConfigManager] Validation error:', error);
      return false;
    }
  }
  
  /**
   * Get built-in default configuration
   * This is embedded in the extension and used as last resort fallback
   */
  getBuiltInConfig() {
    if (this.builtInConfig) {
      return this.builtInConfig;
    }
    
    // Built-in configuration - mirrors current hardcoded selectors
    this.builtInConfig = {
      version: '1.0.0-builtin',
      lastUpdated: '2025-12-24T00:00:00Z',
      description: 'Built-in fallback configuration',
      sites: {
        'yahoo.com': {
          enabled: true,
          priority: 10,
          articleSelectors: [
            'li.ntk-item',
            'li.stream-item',
            '.js-stream-content',
            '[data-uuid]'
          ],
          headlineSelectors: [
            'h3.Fw(600)',
            '[data-test-locator="item-title"]',
            '.js-stream-item-title'
          ],
          substitutionMode: 'overlay',
          infiniteScrollEnabled: true
        },
        'cnn.com': {
          enabled: true,
          priority: 9,
          articleSelectors: [
            'li.card.container__item',
            'li[data-component-name="card"]',
            'article.container__headline-link'
          ],
          headlineSelectors: [
            '[data-testid="card-headline"]',
            'span.container__headline-text',
            'h3.container__headline'
          ],
          substitutionMode: 'overlay',
          infiniteScrollEnabled: true
        },
        'bbc.com': {
          enabled: true,
          priority: 8,
          articleSelectors: [
            '[data-testid="dundee-card"]',
            '[data-testid="manchester-card"]',
            '[data-testid="chester-card"]'
          ],
          headlineSelectors: [
            '[data-testid="card-headline"]',
            'h2[data-testid="card-headline"]',
            'h3[data-testid="card-headline"]'
          ],
          substitutionMode: 'overlay',
          infiniteScrollEnabled: false
        }
      },
      fallback: {
        articleSelectors: [
          'article',
          '.article',
          '[role="article"]',
          '.news-item',
          '.story'
        ],
        headlineSelectors: [
          'h1',
          'h2',
          'h3',
          '[role="heading"]'
        ],
        substitutionMode: 'overlay',
        infiniteScrollEnabled: false
      }
    };
    
    return this.builtInConfig;
  }
  
  /**
   * Clear cached configuration
   */
  async clearCache() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.cacheKey], () => {
        console.log('[RemoteConfigManager] Cache cleared');
        resolve();
      });
    });
  }
  
  /**
   * Get cache info (for debugging)
   */
  async getCacheInfo() {
    const cached = await this.getCachedConfig();
    if (!cached) {
      return { cached: false };
    }
    
    return {
      cached: true,
      version: cached.version,
      timestamp: new Date(cached.timestamp).toISOString(),
      age: Math.round((Date.now() - cached.timestamp) / 1000 / 60) + ' minutes',
      expired: this.isCacheExpired(cached)
    };
  }
  
  /**
   * Utility: sleep function for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
