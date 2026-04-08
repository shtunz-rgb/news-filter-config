/**
 * Yahoo Article Extractor
 * v6.4.4 - Extracts articles from Yahoo section pages
 * UPDATED: Handles THREE HTML patterns + HTML entity decoding
 */


const YahooExtractor = {
  /**
   * Extract articles from Yahoo HTML
   * @param {string} html - The HTML content
   * @param {string} sectionKey - The section key
   * @returns {Array} - Array of article objects
   */
  extract(html, sectionKey) {
    const limit = 20;
    console.log('[YahooExtractor v6.4.4] Extracting Yahoo articles...');
    
    const articles = [];
    const seenUrls = new Set(); // Track unique URLs to avoid duplicates
    
    // Yahoo has THREE different HTML patterns:
    // Pattern 1 (www, tech): <h3><a href="URL">HEADLINE</a></h3>
    // Pattern 2 (sports): <a href="URL"><div class="_ys_faw730">HEADLINE</div></a>
    // Pattern 3 (finance): <a href="URL"><h3>HEADLINE</h3></a>
    
    // Extract using Pattern 1: <h3><a href="URL">HEADLINE</a></h3>
    this.extractPattern1(html, articles, seenUrls, limit);
    
    // Extract using Pattern 3: <a href="URL"><h3>HEADLINE</h3></a>
    if (articles.length < limit) {
      this.extractPattern3(html, articles, seenUrls, limit);
    }
    
    // Extract using Pattern 2: <a href="URL"><div class="_ys_faw730">HEADLINE</div></a>
    if (articles.length < limit) {
      this.extractPattern2(html, articles, seenUrls, limit);
    }
    
    console.log('[YahooExtractor v6.4.4] Total articles extracted:', articles.length);
    console.log('[YahooExtractor v6.4.4] Unique URLs processed:', seenUrls.size);
    
    return articles;
  },
  
  /**
   * Extract Pattern 1: <h3><a href="URL">HEADLINE</a></h3>
   * Used by: www.yahoo.com, tech.yahoo.com
   */
  extractPattern1(html, articles, seenUrls, limit) {
    console.log('[YahooExtractor v6.4.4] Trying Pattern 1 (h3 > a)...');
    
    const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    let h3Match;
    
    while ((h3Match = h3Regex.exec(html)) !== null && articles.length < limit) {
      const h3Content = h3Match[1];
      
      // Extract link and headline from within this h3
      const linkMatch = h3Content.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
      
      if (linkMatch) {
        let url = linkMatch[1];
        const headline = decodeHtmlEntities(linkMatch[2].trim());
        
        // Convert relative URLs to absolute
        if (url.startsWith('/')) {
          url = 'https://www.yahoo.com' + url;
        }
        
        // Add article if valid
        if (this.addArticle(url, headline, articles, seenUrls)) {
          console.log('[YahooExtractor v6.4.4] Pattern 1 - Article', articles.length, ':', headline.substring(0, 50) + '...');
        }
      }
    }
    
    console.log('[YahooExtractor v6.4.4] Pattern 1 extracted:', articles.length, 'articles');
  },
  
  /**
   * Extract Pattern 2: <a href="URL"><div class="_ys_faw730">HEADLINE</div></a>
   * Used by: sports.yahoo.com
   */
  extractPattern2(html, articles, seenUrls, limit) {
    console.log('[YahooExtractor v6.4.4] Trying Pattern 2 (sports structure)...');
    
    const startCount = articles.length;
    
    // Match: <a href="URL">...<div class="_ys_faw730">HEADLINE</div>...</a>
    const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    
    while ((linkMatch = linkRegex.exec(html)) !== null && articles.length < limit) {
      let url = linkMatch[1];
      const linkContent = linkMatch[2];
      
      // Look for headline in <div class="_ys_faw730">
      const headlineMatch = linkContent.match(/<div[^>]*class="[^"]*_ys_faw730[^"]*"[^>]*>([^<]+)<\/div>/i);
      
      if (headlineMatch) {
        const headline = decodeHtmlEntities(headlineMatch[1].trim());
        
        // Convert relative URLs to absolute
        if (url.startsWith('/')) {
          // For sports subdomain, use sports.yahoo.com
          if (url.includes('/nfl/') || url.includes('/nba/') || url.includes('/mlb/') || url.includes('/nhl/') || url.includes('/soccer/')) {
            url = 'https://sports.yahoo.com' + url;
          } else {
            url = 'https://www.yahoo.com' + url;
          }
        }
        
        // Add article if valid
        if (this.addArticle(url, headline, articles, seenUrls)) {
          console.log('[YahooExtractor v6.4.4] Pattern 2 - Article', articles.length, ':', headline.substring(0, 50) + '...');
        }
      }
    }
    
    console.log('[YahooExtractor v6.4.4] Pattern 2 extracted:', (articles.length - startCount), 'additional articles');
  },
  
  /**
   * Extract Pattern 3: <a href="URL"><h3>HEADLINE</h3></a>
   * Used by: finance.yahoo.com
   */
  extractPattern3(html, articles, seenUrls, limit) {
    console.log('[YahooExtractor v6.4.4] Trying Pattern 3 (a > h3)...');
    
    const startCount = articles.length;
    
    // Match: <a href="URL">...<h3>HEADLINE</h3>...</a>
    const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    
    while ((linkMatch = linkRegex.exec(html)) !== null && articles.length < limit) {
      let url = linkMatch[1];
      const linkContent = linkMatch[2];
      
      // Look for headline in <h3> inside this <a> tag
      const h3Match = linkContent.match(/<h3[^>]*>([^<]+)<\/h3>/i);
      
      if (h3Match) {
        const headline = decodeHtmlEntities(h3Match[1].trim());
        
        // Convert relative URLs to absolute
        if (url.startsWith('/')) {
          // For finance subdomain, use finance.yahoo.com
          if (url.includes('/news/')) {
            url = 'https://finance.yahoo.com' + url;
          } else {
            url = 'https://www.yahoo.com' + url;
          }
        }
        
        // Add article if valid
        if (this.addArticle(url, headline, articles, seenUrls)) {
          console.log('[YahooExtractor v6.4.4] Pattern 3 - Article', articles.length, ':', headline.substring(0, 50) + '...');
        }
      }
    }
    
    console.log('[YahooExtractor v6.4.4] Pattern 3 extracted:', (articles.length - startCount), 'additional articles');
  },
  
  /**
   * Add article to list if valid and not duplicate
   * @returns {boolean} - True if article was added
   */
  addArticle(url, headline, articles, seenUrls) {
    // Skip if we've already seen this URL (deduplication)
    if (seenUrls.has(url)) {
      return false;
    }
    
    // Only include Yahoo URLs with /article or /news/
    if (url.includes('yahoo.com') && (url.includes('/article') || url.includes('/news/'))) {
      articles.push({
        title: headline,
        url: url
      });
      
      seenUrls.add(url);
      return true;
    }
    
    return false;
  }
};
