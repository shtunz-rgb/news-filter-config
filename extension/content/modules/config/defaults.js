/**
 * Default configuration constants for the News Filter extension
 * Version: 2.3
 */

export const DEFAULT_CONFIG = {
  DEBUG: false,
  DEBOUNCE_DELAY: 100,
  STORAGE_QUEUE_BATCH_SIZE: 10,
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Substitution system
  SUBSTITUTION_SITES: ['yahoo.com', 'cnn.com', 'bbc.co.uk', 'bbc.com'],
  
  // Problematic domains with strict CSP
  PROBLEMATIC_DOMAINS: [
    'nytimes.com',
    'reuters.com',
    'thehill.com',
    'breitbart.com',
    'zerohedge.com'
  ],
  
  // Layout compatibility thresholds
  LAYOUT_COMPATIBILITY: {
    WIDTH_VARIANCE: 0.2,  // 20% variance allowed
    HEIGHT_VARIANCE: 0.2, // 20% variance allowed
    MIN_DIMENSION: 50     // Minimum width/height in pixels
  },
  
  // Performance thresholds
  PERFORMANCE: {
    MAX_ARTICLES_PER_SCAN: 500,
    MAX_HEADLINES_PER_SCAN: 1000,
    SELECTOR_TIMEOUT: 5000 // 5 seconds
  }
};

export const VALIDATION_RULES = {
  TITLE_MIN_LENGTH: 15,
  TITLE_MAX_LENGTH: 500,
  SKIP_HOMEPAGE: true,
  SKIP_PHOTO_CREDITS: true,
  SKIP_JAVASCRIPT_CODE: true
};

export const STORAGE_KEYS = {
  KEYWORDS: 'keywords',
  IS_ENABLED: 'isEnabled',
  FILTERED_ARTICLES: 'filteredArticles',
  FILTERED_COUNT: 'filteredCount',
  LAST_SCAN: 'lastScan'
};

export const MESSAGE_ACTIONS = {
  UPDATE_KEYWORDS: 'updateKeywords',
  TOGGLE_ENABLED: 'toggleEnabled',
  GET_STATUS: 'getStatus',
  UPDATE_FILTER_COUNT: 'updateFilterCount',
  TRACK_ARTICLE: 'trackArticle',
  GET_FILTERED_ARTICLES: 'getFilteredArticles'
};
