/**
 * CNN Sections Configuration
 * v6.1.7 - Section Articles Feature (Service Worker Compatible)
 * 
 * Defines CNN section URLs and CSS selectors for article extraction
 * Uses regex-based parsing instead of DOMParser for service worker compatibility
 * Uses date-based URL pattern matching instead of class-based matching
 */

const CNN_SECTIONS = {
  world: {
    name: 'World',
    url: 'https://edition.cnn.com/world',
    selectors: {
      article: 'span[data-container-type="article-container"]',
      headline: 'span.container__headline-text',
      link: 'a[data-link-type="article"]'
    }
  },
  politics: {
    name: 'Politics',
    url: 'https://edition.cnn.com/politics',
    selectors: {
      article: 'span[data-container-type="article-container"]',
      headline: 'span.container__headline-text',
      link: 'a[data-link-type="article"]'
    }
  },
  business: {
    name: 'Business',
    url: 'https://edition.cnn.com/business',
    selectors: {
      article: 'span[data-container-type="article-container"]',
      headline: 'span.container__headline-text',
      link: 'a[data-link-type="article"]'
    }
  },
  health: {
    name: 'Health',
    url: 'https://edition.cnn.com/health',
    selectors: {
      article: 'span[data-container-type="article-container"]',
      headline: 'span.container__headline-text',
      link: 'a[data-link-type="article"]'
    }
  },
  entertainment: {
    name: 'Entertainment',
    url: 'https://edition.cnn.com/entertainment',
    selectors: {
      article: 'span[data-container-type="article-container"]',
      headline: 'span.container__headline-text',
      link: 'a[data-link-type="article"]'
    }
  },
  style: {
    name: 'Style',
    url: 'https://edition.cnn.com/style',
    selectors: {
      article: 'span[data-container-type="article-container"]',
      headline: 'span.container__headline-text',
      link: 'a[data-link-type="article"]'
    }
  },
  travel: {
    name: 'Travel',
    url: 'https://edition.cnn.com/travel',
    selectors: {
      article: 'span[data-container-type="article-container"]',
      headline: 'span.container__headline-text',
      link: 'a[data-link-type="article"]'
    }
  },
  sports: {
    name: 'Sports',
    url: 'https://edition.cnn.com/sport',
    selectors: {
      article: 'span[data-container-type="article-container"]',
      headline: 'span.container__headline-text',
      link: 'a[data-link-type="article"]'
    }
  }
};

/**
 * Extract articles from CNN section HTML using regex
 * Service worker compatible - no DOMParser
 * 
 * @param {string} html - The HTML content of the section page
 * @param {string} sectionKey - The section key (e.g., 'world', 'politics')
 * @returns {Array} Array of article objects with title and url
 */
function extractCNNArticles(html, sectionKey) {
  const section = CNN_SECTIONS[sectionKey];
  if (!section) return [];
  
  const articles = [];
  
  try {
    // IMPROVED APPROACH: Use date-based URL pattern matching
    // CNN article URLs follow pattern: /YYYY/MM/DD/section/article-slug
    // This is more reliable than class-based matching
    const linkRegex = /<a[^>]*href="(\/\d{4}\/\d{2}\/\d{2}[^"]*?)"[^>]*>/gi;
    let linkMatch;
    const links = [];
    
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      links.push({
        url: linkMatch[1],
        index: linkMatch.index
      });
    }
    
    console.log('[CNN Sections v6.1.7] Found ' + links.length + ' article links');
    
    // Step 2: For each link, find the nearest headline after it
    const headlineRegex = /<span[^>]*class="[^"]*container__headline-text[^"]*"[^>]*>([^<]+)<\/span>/gi;
    
    for (let i = 0; i < Math.min(links.length, 20); i++) {
      const link = links[i];
      const nextLinkIndex = i + 1 < links.length ? links[i + 1].index : html.length;
      
      // Search for headline between this link and the next link
      const searchArea = html.substring(link.index, nextLinkIndex);
      const headlineMatch = headlineRegex.exec(searchArea);
      
      if (!headlineMatch || !headlineMatch[1]) {
        console.log('[CNN Sections v6.1.7] No headline found for link ' + i);
        continue;
      }
      
      const title = decodeHtmlEntities(headlineMatch[1].trim());
      let url = link.url.trim();
      
      // Ensure URL is absolute
      if (url.startsWith('/')) {
        url = 'https://edition.cnn.com' + url;
      } else if (!url.startsWith('http')) {
        url = 'https://edition.cnn.com/' + url;
      }
      
      if (title && url) {
        articles.push({
          title: title,
          url: url,
          source: 'CNN',
          section: section.name
        });
        console.log('[CNN Sections v6.1.7] Extracted article ' + (articles.length) + ': ' + title.substring(0, 50));
      }
    }
    
    console.log('[CNN Sections v6.1.7] Total articles extracted: ' + articles.length);
  } catch (error) {
    console.error('[CNN Sections v6.1.7] Error extracting articles:', error);
  }
  
  return articles;
}

/**
 * Decode HTML entities
 * Converts &amp; to &, &lt; to <, etc.
 * 
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' '
  };
  
  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }
  
  return result;
}

/**
 * Get all CNN section keys
 * @returns {Array} Array of section keys
 */
function getCNNSectionKeys() {
  return Object.keys(CNN_SECTIONS);
}

/**
 * Get CNN section by key
 * @param {string} sectionKey - The section key
 * @returns {Object} Section configuration object
 */
function getCNNSection(sectionKey) {
  return CNN_SECTIONS[sectionKey];
}
