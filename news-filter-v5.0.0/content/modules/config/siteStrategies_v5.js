/**
 * Site-specific configuration strategies for the News Filter extension v5.0.0
 * Enhanced with Phase 4 substitution and Phase 2.5 CSS injection support
 * Version: 5.0.0
 */

export const SITE_STRATEGIES = {
  'yahoo.com': {
    articleSelectors: [
      '.slotView',
      '.opinionsSlotItem',
      '.mainArea',
      'div.slotView',
      'li.js-stream-content',
      '.stream-item',
      '[data-test-locator="lead-item"]',
      '[data-test-locator="stream-item"]',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '.js-stream-item-title',
      '[class*="headline"]',
      '[class*="title"]',
      '[data-test-locator="lead-summary"]',
      '[data-test-locator="stream-item-summary"]'
    ],
    substitutionMode: 'replace',
    infiniteScrollSelectors: [
      '#strm',
      '.stream-container',
      'li.js-stream-content',
      '.stream-item',
      '#Fin-Stream'
    ],
    heroSelectors: [
      '.ntk-lead',
      '#ntk',
      '.ntk-wrap',
      '[data-test-locator="lead-item"]'
    ],
    
    // Phase 4: Substitution Configuration
    substitution: {
      enabled: true,
      dimensionTolerance: { width: 0.20, height: 0.20 }, // ±20% (fluid layout)
      aspectRatioTolerance: 0.15,
      maxPoolSize: 50,
      cacheExpiry: 5000 // 5 seconds
    },
    
    // Phase 4: External Feed Configuration
    externalFeeds: {
      enabled: true,
      sources: [
        { type: 'rss', url: 'https://feeds.yahoo.com/news' }
      ],
      cacheTTL: 300000 // 5 minutes
    },
    
    // Phase 4: Placeholder Configuration
    placeholder: {
      variant: 'branded',
      backgroundColor: '#f5f5f5',
      textColor: '#333',
      message: 'Content filtered for your preference'
    },
    
    validators: [],
    priority: 10,
    notes: 'Yahoo News with infinite scroll support and Phase 4 substitution'
  },

  'bbc.com': {
    articleSelectors: [
      '[data-testid="dundee-card"]',
      'div[data-indexcard="true"]',
      'li[class*="ssrcss-rs7w2i-ListItem"]',
      'li[class*="ssrcss-1amy2cn-ListItem"]',
      'div[data-testid="promo"]',
      'li[data-testid="carousel-item"]',
      '.ssrcss-1t3sjik-Promo',
      '.ssrcss-ip38cr-PortraitPromoContainer',
      '.ssrcss-viy7j3-PromoLayoutButton',
      '.media-list__item',
      '.gs-c-promo',
      '.nw-c-top-stories__secondary-item',
      '.nw-c-most-read__items li',
      'article',
      '.article'
    ],
    headlineSelectors: [
      '[data-testid="card-headline"]',
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'replace',
    
    // Phase 4: Substitution Configuration
    substitution: {
      enabled: true,
      dimensionTolerance: { width: 0.05, height: 0.05 }, // ±5% (strict grid)
      aspectRatioTolerance: 0.05,
      maxPoolSize: 50,
      cacheExpiry: 5000
    },
    
    // Phase 4: External Feed Configuration
    externalFeeds: {
      enabled: true,
      sources: [
        { type: 'rss', url: 'http://feeds.bbc.co.uk/news/rss.xml' }
      ],
      cacheTTL: 300000
    },
    
    // Phase 4: Placeholder Configuration
    placeholder: {
      variant: 'branded',
      backgroundColor: '#f5f5f5',
      textColor: '#000',
      message: 'Content filtered for your preference'
    },
    
    validators: [],
    priority: 9,
    notes: 'BBC News with strict grid layout and Phase 4 substitution'
  },

  'bbc.co.uk': {
    articleSelectors: [
      '[data-testid="dundee-card"]',
      'div[data-indexcard="true"]',
      'li[class*="ssrcss-rs7w2i-ListItem"]',
      'li[class*="ssrcss-1amy2cn-ListItem"]',
      'div[data-testid="promo"]',
      'li[data-testid="carousel-item"]',
      '.ssrcss-1t3sjik-Promo',
      '.ssrcss-ip38cr-PortraitPromoContainer',
      '.ssrcss-viy7j3-PromoLayoutButton',
      '.media-list__item',
      '.gs-c-promo',
      '.nw-c-top-stories__secondary-item',
      '.nw-c-most-read__items li',
      'article',
      '.article'
    ],
    headlineSelectors: [
      '[data-testid="card-headline"]',
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'replace',
    
    substitution: {
      enabled: true,
      dimensionTolerance: { width: 0.05, height: 0.05 },
      aspectRatioTolerance: 0.05,
      maxPoolSize: 50,
      cacheExpiry: 5000
    },
    
    externalFeeds: {
      enabled: true,
      sources: [
        { type: 'rss', url: 'http://feeds.bbc.co.uk/news/rss.xml' }
      ],
      cacheTTL: 300000
    },
    
    placeholder: {
      variant: 'branded',
      backgroundColor: '#f5f5f5',
      textColor: '#000',
      message: 'Content filtered for your preference'
    },
    
    validators: [],
    priority: 9,
    notes: 'BBC News UK with Phase 4 substitution'
  },

  'cnn.com': {
    articleSelectors: [
      'div.card.container__item',
      'div[data-component-name="card"]',
      '.container__title',
      'div.container__title',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'replace',
    
    substitution: {
      enabled: true,
      dimensionTolerance: { width: 0.10, height: 0.10 }, // ±10% (moderate)
      aspectRatioTolerance: 0.10,
      maxPoolSize: 50,
      cacheExpiry: 5000
    },
    
    externalFeeds: {
      enabled: true,
      sources: [
        { type: 'rss', url: 'http://rss.cnn.com/rss/edition.rss' }
      ],
      cacheTTL: 300000
    },
    
    placeholder: {
      variant: 'branded',
      backgroundColor: '#f5f5f5',
      textColor: '#CC0000',
      message: 'Content filtered for your preference'
    },
    
    validators: [],
    priority: 8,
    notes: 'CNN News with card-based layout and Phase 4 substitution'
  },

  'theguardian.com': {
    articleSelectors: [
      '.dcr-7ajvu9',
      '.dcr-12lqghr',
      'li[data-link-name*="sublinks"]',
      'div[data-format-theme]',
      'div[data-format-design]',
      'li.dcr-1v3yego',
      'li.dcr-ixe7de',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'replace',
    
    substitution: {
      enabled: true,
      dimensionTolerance: { width: 0.10, height: 0.10 },
      aspectRatioTolerance: 0.10,
      maxPoolSize: 50,
      cacheExpiry: 5000
    },
    
    externalFeeds: {
      enabled: true,
      sources: [
        { type: 'rss', url: 'https://www.theguardian.com/world/rss' }
      ],
      cacheTTL: 300000
    },
    
    placeholder: {
      variant: 'branded',
      backgroundColor: '#f5f5f5',
      textColor: '#0084C6',
      message: 'Content filtered for your preference'
    },
    
    validators: [],
    priority: 8,
    notes: 'The Guardian with DCR card support and Phase 4 substitution'
  },

  'nytimes.com': {
    articleSelectors: [
      '.story-wrapper',
      '.tpl-lb',
      '[data-tpl="sli"]',
      '[data-tpl="lb"]',
      '.css-1e505by',
      '.css-114aoa5',
      '.css-1cp3ece',
      '.css-1l4spti',
      '.css-1ez5fsm',
      '.css-1i8vfl5',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    
    substitution: {
      enabled: false, // NYT has strict CSP
      dimensionTolerance: { width: 0.10, height: 0.10 },
      aspectRatioTolerance: 0.10,
      maxPoolSize: 50,
      cacheExpiry: 5000
    },
    
    externalFeeds: {
      enabled: false // NYT has strict API policies
    },
    
    placeholder: {
      variant: 'generic',
      backgroundColor: '#f5f5f5',
      textColor: '#333',
      message: 'Content filtered for your preference'
    },
    
    validators: [],
    priority: 8,
    notes: 'New York Times with strict CSP - overlay mode only'
  },

  'default': {
    articleSelectors: [
      'article',
      '.article',
      '[role="article"]',
      '.news-item',
      '.story',
      '.post',
      '.item',
      'div[class*="article"]',
      'div[class*="story"]'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]',
      '[role="heading"]',
      'a[href]'
    ],
    substitutionMode: 'overlay',
    
    substitution: {
      enabled: true,
      dimensionTolerance: { width: 0.15, height: 0.15 }, // ±15% (default)
      aspectRatioTolerance: 0.15,
      maxPoolSize: 50,
      cacheExpiry: 5000
    },
    
    externalFeeds: {
      enabled: false // Disabled by default
    },
    
    placeholder: {
      variant: 'generic',
      backgroundColor: '#f5f5f5',
      textColor: '#333',
      message: 'Content filtered for your preference'
    },
    
    validators: [],
    priority: 1,
    notes: 'Default fallback for unsupported sites with Phase 4 support'
  }
};

/**
 * Get site configuration for a given hostname
 * @param {string} hostname - The current page hostname
 * @returns {object} Site configuration object
 */
export function getSiteConfig(hostname) {
  // Find matching site config or use default
  for (const [domain, config] of Object.entries(SITE_STRATEGIES)) {
    if (domain !== 'default' && hostname.includes(domain)) {
      return { ...config, domain };
    }
  }
  return { ...SITE_STRATEGIES.default, domain: 'default' };
}

/**
 * Get all supported domains
 * @returns {array} Array of domain names
 */
export function getSupportedDomains() {
  return Object.keys(SITE_STRATEGIES).filter(key => key !== 'default');
}

/**
 * Check if a site supports Phase 4 substitution
 * @param {string} hostname - The current page hostname
 * @returns {boolean} True if substitution is enabled
 */
export function supportsSubstitution(hostname) {
  const config = getSiteConfig(hostname);
  return config.substitution?.enabled === true;
}

/**
 * Check if a site has external feeds configured
 * @param {string} hostname - The current page hostname
 * @returns {boolean} True if feeds are configured
 */
export function hasExternalFeeds(hostname) {
  const config = getSiteConfig(hostname);
  return config.externalFeeds?.enabled === true && 
         config.externalFeeds?.sources?.length > 0;
}
