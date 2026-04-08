/**
 * CNN Article Extractor
 * v6.2.0 - Extracts articles from CNN section pages
 * 
 * CNN uses date-based URL pattern: /YYYY/MM/DD/section/slug
 */


const CNNExtractor = {
  /**
   * Extract articles from CNN HTML
   * @param {string} html - The HTML content of the CNN section page
   * @param {string} sectionKey - The section key (e.g., 'sport', 'world')
   * @returns {Array} Array of article objects with title and url
   */

  extract(html, sectionKey) {
    const articles = [];
    
    try {
      // CNN article URLs follow pattern: /YYYY/MM/DD/section/slug
      // Find all <a> tags with href matching this pattern
      const linkRegex = /<a[^>]*href="(\/\d{4}\/\d{2}\/\d{2}[^"]*?)"[^>]*>/gi;
      let linkMatch;
      const links = [];
      
      while ((linkMatch = linkRegex.exec(html)) !== null) {
        links.push({
          url: linkMatch[1],
          index: linkMatch.index
        });
      }
      
      console.log('[CNN Extractor v6.2.0] Found ' + links.length + ' article links');
      
      // For each link, find the nearest headline after it
      const headlineRegex = /<span[^>]*class="[^"]*container__headline-text[^"]*"[^>]*>([^<]+)<\/span>/gi;
      
      for (let i = 0; i < Math.min(links.length, 20); i++) {
        const link = links[i];
        const nextLinkIndex = i + 1 < links.length ? links[i + 1].index : html.length;
        
        // Search for headline between this link and the next link
        const searchArea = html.substring(link.index, nextLinkIndex);
        const headlineMatch = headlineRegex.exec(searchArea);
        
        if (!headlineMatch || !headlineMatch[1]) {
          console.log('[CNN Extractor v6.2.0] No headline found for link ' + i);
          continue;
        }
        
        const title = this.decodeHtmlEntities(headlineMatch[1].trim());
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
            section: sectionKey
          });
          console.log('[CNN Extractor v6.2.0] Extracted article ' + (articles.length) + ': ' + title.substring(0, 50));
        }
      }
      
      console.log('[CNN Extractor v6.2.0] Total articles extracted: ' + articles.length);
    } catch (error) {
      console.error('[CNN Extractor v6.2.0] Error extracting articles:', error);
    }
    
    return articles;
  },
  
  /**
   * Decode HTML entities
   * @param {string} text - Text with HTML entities
   * @returns {string} Decoded text
   */

  decodeHtmlEntities(text) {
    if (!text) return '';
    
    const map = {
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
    for (const entity in map) {
      result = result.replace(new RegExp(entity, 'g'), map[entity]);
    }
    
    return result;
  }
};
