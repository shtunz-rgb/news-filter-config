/**
 * Article Matcher v7.0.0
 * Finds the best replacement article from the content pool
 * Uses scoring algorithm based on image size, headline length, and layout
 */

class ArticleMatcher {
  constructor() {
    this.version = '7.0.0';
    this.MATCH_THRESHOLD = 80; // Minimum score to consider a match "good enough"
    this.usedReplacements = new Set(); // Track used articles to avoid duplicates
  }

  /**
   * Find the best replacement article for a filtered article
   * Returns { article, score } or null if no good match found
   * @param {Element} filteredElement - The DOM element being filtered
   * @param {Array} contentPool - Pool of replacement articles
   * @param {string} keyword - The filtered keyword to avoid in replacements
   */
  async findBestMatch(filteredElement, contentPool, keyword = '') {
    console.log(`[ArticleMatcher v${this.version}] Finding best match (avoiding keyword: "${keyword}")...`);

    // Analyze the filtered article
    const target = await this.analyzeArticle(filteredElement);
    console.log(`[ArticleMatcher] Target:`, target);

    // Filter out already used replacements
    let availablePool = contentPool.filter(article => 
      !this.usedReplacements.has(article.url)
    );

    // V7.0.6 FIX: Filter out articles that contain the filtered keyword
    if (keyword) {
      const keywordLower = keyword.toLowerCase();
      const beforeCount = availablePool.length;
      availablePool = availablePool.filter(article => 
        !article.title.toLowerCase().includes(keywordLower)
      );
      const filteredOut = beforeCount - availablePool.length;
      if (filteredOut > 0) {
        console.log(`[ArticleMatcher] Filtered out ${filteredOut} articles containing "${keyword}"`);
      }
    }

    if (availablePool.length === 0) {
      // V7.0.5 FIX #3: Don't allow reuse - return null instead to prevent flickering
      console.warn(`[ArticleMatcher] Pool exhausted! No more replacements available.`);
      return null;
    }

    console.log(`[ArticleMatcher] Available pool: ${availablePool.length} articles`);

    // Score each candidate
    const scored = availablePool.map(article => ({
      article,
      score: this.calculateScore(article, target)
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Get best match
    const best = scored[0];
    console.log(`[ArticleMatcher] Best match: "${best.article.title}" (score: ${best.score})`);

    // Mark as used
    this.usedReplacements.add(best.article.url);

    return best;
  }

  /**
   * Analyze a filtered article to extract matching criteria
   */
  async analyzeArticle(element) {
    const analysis = {
      hasImage: false,
      imageWidth: 0,
      imageHeight: 0,
      aspectRatio: 0,
      titleLength: 0,
      layout: 'unknown'
    };

    // Find image
    const img = element.querySelector('img');
    if (img) {
      analysis.hasImage = true;
      
      // Wait for image to load to get natural dimensions
      if (img.complete) {
        analysis.imageWidth = img.naturalWidth || img.width;
        analysis.imageHeight = img.naturalHeight || img.height;
      } else {
        // Use current dimensions if natural dimensions not available
        analysis.imageWidth = img.width;
        analysis.imageHeight = img.height;
      }

      if (analysis.imageHeight > 0) {
        analysis.aspectRatio = analysis.imageWidth / analysis.imageHeight;
      }
    }

    // Find headline
    const headline = element.querySelector('h1, h2, h3, h4, [class*="headline"], [class*="title"]');
    if (headline) {
      analysis.titleLength = headline.textContent.trim().length;
    }

    // Detect layout type (simple heuristic)
    if (img && headline) {
      const imgRect = img.getBoundingClientRect();
      const headlineRect = headline.getBoundingClientRect();
      
      if (imgRect.top < headlineRect.top) {
        analysis.layout = 'vertical'; // Image above text
      } else if (imgRect.left < headlineRect.left) {
        analysis.layout = 'horizontal'; // Image left of text
      } else {
        analysis.layout = 'mixed';
      }
    } else if (img) {
      analysis.layout = 'image-only';
    } else {
      analysis.layout = 'text-only';
    }

    return analysis;
  }

  /**
   * Calculate match score between candidate and target
   * Score range: 0-200+ (higher is better)
   */
  calculateScore(candidate, target) {
    let score = 100; // Base score

    // 1. Image presence match (critical)
    if (target.hasImage && !candidate.hasImage) {
      score -= 50; // Big penalty for missing image
    } else if (!target.hasImage && candidate.hasImage) {
      score += 10; // Small bonus for extra image
    }

    // 2. Aspect ratio match (high priority)
    if (target.hasImage && candidate.imageUrl) {
      // Estimate candidate aspect ratio (we'll need to load image to get exact ratio)
      // For now, assume most news images are 16:9 or 4:3
      const candidateRatio = 16 / 9; // Default assumption
      
      if (target.aspectRatio > 0) {
        const ratioDiff = Math.abs(candidateRatio - target.aspectRatio);
        
        if (ratioDiff < 0.2) {
          score += 50; // Excellent match
        } else if (ratioDiff < 0.5) {
          score += 20; // Acceptable match
        } else {
          score -= 30; // Poor match
        }
      }
    }

    // 3. Headline length match (medium priority)
    const lengthDiff = Math.abs(candidate.titleLength - target.titleLength);
    
    if (lengthDiff < 10) {
      score += 30; // Very close match
    } else if (lengthDiff < 20) {
      score += 15; // Close match
    } else if (lengthDiff < 30) {
      score += 5; // Acceptable
    } else if (lengthDiff > 50) {
      score -= 20; // Too different
    }

    // 4. Bonus for certain sections (optional preference)
    if (candidate.section === 'sports') {
      score += 5; // Slight preference for sports (usually neutral content)
    }

    return score;
  }

  /**
   * Check if a match score is good enough for substitution
   */
  isGoodMatch(score) {
    return score >= this.MATCH_THRESHOLD;
  }

  /**
   * Reset used replacements (for new page or manual refresh)
   */
  reset() {
    console.log(`[ArticleMatcher] Reset - clearing used replacements`);
    this.usedReplacements.clear();
  }

  /**
   * Get statistics about matching
   */
  getStats() {
    return {
      usedCount: this.usedReplacements.size,
      threshold: this.MATCH_THRESHOLD
    };
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.ArticleMatcher = ArticleMatcher;
}
