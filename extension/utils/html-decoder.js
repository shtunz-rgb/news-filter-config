/**
 * HTML Entity Decoder Utility
 * v6.4.4 - Decodes HTML entities in article titles
 */

const HtmlDecoder = {
  /**
   * Decode HTML entities in a string
   * @param {string} text - Text containing HTML entities
   * @returns {string} - Decoded text
   */
  decode(text) {
    if (!text) return text;
    
    // Common HTML entities mapping
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
      '&#x27;': "'",
      '&#x2F;': '/',
      '&#39;': "'",
      '&#34;': '"',
      '&nbsp;': ' ',
      '&ndash;': '–',
      '&mdash;': '—',
      '&lsquo;': ''',
      '&rsquo;': ''',
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&hellip;': '…'
    };
    
    // Replace named entities
    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }
    
    // Replace numeric entities (&#123; or &#xAB;)
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    });
    
    decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return decoded;
  }
};
