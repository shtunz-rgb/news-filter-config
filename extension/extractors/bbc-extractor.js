/**
 * BBC Article Extractor
 * v6.2.9 - Extracts articles from BBC section pages
 * FIXED: Container-based extraction - headlines are INSIDE link tags
 */


const BBCExtractor = {
  /**
   * Extract articles from BBC HTML
   * @param {string} html - The HTML content
   * @param {string} sectionKey - The section key
   * @returns {Array} - Array of article objects
   */

  extract(html, sectionKey) {
    const limit = 20;
    console.log('[BBCExtractor v6.2.9] Extracting BBC articles...');
    
    const articles = [];
    const seenUrls = new Set(); // Track unique URLs to avoid duplicates
    
    // BBC structure: <a href="/*/articles/*">...<h2 data-testid="card-headline">TITLE</h2>...</a>

    // The headline is INSIDE the link tag, so we need to extract both together
    
    // Match: <a href="URL">...content...</a> where URL contains /articles/
    const articleBlockRegex = /<a[^>]*href="(\/[^"]*\/articles\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    
    let blockMatch;
    
    // Find all article link blocks
    while ((blockMatch = articleBlockRegex.exec(html)) !== null) {
      const url = blockMatch[1];
      const linkContent = blockMatch[2]; // Everything inside the <a> tag
      
      // Skip if we've already seen this URL (deduplication)
      if (seenUrls.has(url)) {
        console.log('[BBCExtractor v6.2.9] Skipping duplicate URL:', url);
        continue;
      }
      
      // Extract headline from within this link's content
      const headlineMatch = linkContent.match(/<h2[^>]*data-testid="card-headline"[^>]*>([^<]+)<\/h2>/i);
      
      if (headlineMatch) {
        const headline = decodeHtmlEntities(headlineMatch[1].trim());
        const fullUrl = 'https://www.bbc.com' + url;
        
        articles.push({
          title: headline,
          url: fullUrl
        });
        
        seenUrls.add(url);
        
        console.log('[BBCExtractor v6.2.9] Extracted article', articles.length, ':', headline.substring(0, 50) + '...');
        
        // Stop if we've reached the limit
        if (articles.length >= limit) {
          break;
        }
      } else {
        console.log('[BBCExtractor v6.2.9] No headline found in link block for URL:', url);
      }
    }
    
    console.log('[BBCExtractor v6.2.9] Total articles extracted:', articles.length);
    console.log('[BBCExtractor v6.2.9] Unique URLs processed:', seenUrls.size);
    
    return articles;
  }
};
