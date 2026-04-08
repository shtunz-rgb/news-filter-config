/**
 * Site-specific configuration strategies for the News Filter extension
 * This module contains all CSS selectors and configuration for supported news sites
 * Version: 2.3
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
    validators: [],
    priority: 10,
    notes: 'Yahoo News with infinite scroll support'
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
    validators: [],
    priority: 9,
    notes: 'BBC News with comprehensive article detection'
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
    validators: [],
    priority: 9,
    notes: 'BBC News UK with comprehensive article detection'
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
    validators: [],
    priority: 8,
    notes: 'The Guardian with DCR card support'
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
    validators: [],
    priority: 8,
    notes: 'CNN News with card-based layout'
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
    validators: [],
    priority: 8,
    notes: 'New York Times with strict CSP'
  },

  'reuters.com': {
    articleSelectors: [
      '.media-story-card',
      '.story-card',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 7,
    notes: 'Reuters with strict CSP'
  },

  'apnews.com': {
    articleSelectors: [
      '.FeedCard',
      '.CardHeadline',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 7,
    notes: 'AP News'
  },

  'wsj.com': {
    articleSelectors: [
      '.WSJTheme--story--XB4V2mLz',
      '.article-wrap',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 7,
    notes: 'Wall Street Journal'
  },

  'cnbc.com': {
    articleSelectors: [
      '.FeaturedCard-container',
      'div[id*="FeaturedCard"]',
      '.FeaturedCard-imageContainer',
      '.FeaturedCard-content',
      '.Card-standardBreakerCard',
      '.Card-card',
      '.RiverPlusCard-container',
      '.LatestNews-item',
      'li.LatestNews-item',
      '.SecondaryCard-container',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 7,
    notes: 'CNBC with featured card support'
  },

  'politico.com': {
    articleSelectors: [
      'section.media-item',
      '.media-item',
      'section.media-item.top',
      'div.module.single-column-list section.media-item',
      'div.module.has-bottom-divider section.media-item',
      '.story-frag',
      '.headline',
      '.module.has-bottom-divider',
      'div.module.single-column-list',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 7,
    notes: 'Politico with media-item structure'
  },

  'foxnews.com': {
    articleSelectors: [
      '.big-top',
      'article.story-1',
      'article.story-2',
      'article.story-3',
      'div.m',
      'div.video-stream',
      'div.info-header',
      'div.title',
      'div.related',
      'li.related-item',
      'div.info',
      'div.article',
      'div.story',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 7,
    notes: 'Fox News with multiple container variants'
  },

  'washingtonpost.com': {
    articleSelectors: [
      'li.wpds-c-iPlnLe',
      'li[data-link-detail]',
      'li[class*="wpds-c-"]',
      'ul li a, ol li a',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 7,
    notes: 'Washington Post with pattern-based detection'
  },

  'bloomberg.com': {
    articleSelectors: [
      '.story-package-module__story',
      '.story-list-story',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 6,
    notes: 'Bloomberg'
  },

  'usatoday.com': {
    articleSelectors: [
      '.gnt_m_be',
      '.gnt_m_flm',
      '.gnt_m_flm_a',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]'
    ],
    substitutionMode: 'overlay',
    validators: [],
    priority: 6,
    notes: 'USA Today'
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
    validators: [],
    priority: 1,
    notes: 'Default fallback for unsupported sites'
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
