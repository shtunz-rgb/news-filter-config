/**
 * Ynet Article Extractor
 * v6.3.0 - Extracts articles from Ynet section pages
 * Supports Hebrew (RTL) text
 * FIXED: Container-based extraction matching actual Ynet HTML structure
 */


const YnetExtractor = {
  /**
   * Extract articles from Ynet HTML
   * @param {string} html - The HTML content
   * @param {string} sectionKey - The section key
   * @returns {Array} - Array of article objects
   */

  extract(html, sectionKey) {
    const limit = 20;
    console.log('[YnetExtractor v6.3.0] Extracting Ynet articles...');
    
    const articles = [];
    const seenUrls = new Set(); // Track unique URLs to avoid duplicates
    
    // Ynet structure: <div class="slotTitle"><a href="URL">HEADLINE</a></div>
    // The headline is the text content inside the <a> tag
    // URLs are absolute: https://www.ynet.co.il/... or https://p.ynet.co.il/... or https://pplus.ynet.co.il/...
    
    // Match: <div class="slotTitle">...<a href="URL">HEADLINE</a>...</div>
    // We'll extract the <a> tags within slotTitle divs
    const slotTitleRegex = /<div[^>]*class="[^"]*slotTitle[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    
    let slotMatch;
    
    // Find all slotTitle divs
    while ((slotMatch = slotTitleRegex.exec(html)) !== null) {
      const slotContent = slotMatch[1];
      
      // Extract link and headline from within this slot
      // Match: <a href="URL">HEADLINE</a>
      const linkMatch = slotContent.match(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([^<]+)<\/a>/i);
      
      if (linkMatch) {
        const url = linkMatch[1];
        const headline = decodeHtmlEntities(linkMatch[2].trim());
        
        // Skip if we've already seen this URL (deduplication)
        if (seenUrls.has(url)) {
          console.log('[YnetExtractor v6.3.0] Skipping duplicate URL:', url);
          continue;
        }
        
        // Only include Ynet article URLs (filter out external links)
        if (url.includes('ynet.co.il')) {
          articles.push({
            title: headline,
            url: url
          });
          
          seenUrls.add(url);
          
          console.log('[YnetExtractor v6.3.0] Extracted article', articles.length, ':', headline.substring(0, 50) + '...');
          
          // Stop if we've reached the limit
          if (articles.length >= limit) {
            break;
          }
        }
      }
    }
    
    console.log('[YnetExtractor v6.3.0] Total articles extracted:', articles.length);
    console.log('[YnetExtractor v6.3.0] Unique URLs processed:', seenUrls.size);
    
    return articles;
  }
};
