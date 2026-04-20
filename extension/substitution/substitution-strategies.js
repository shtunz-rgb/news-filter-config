/**
 * Substitution Strategies v8.0.4
 * Site-specific strategies for replacing filtered articles with replacement content
 * 
 * V8.0.0: Added substituteWithImage() for DB-backed image article replacement
 * V8.0.1: Fixed CNN two-anchor card structure handling:
 *   - Image and headline are in SEPARATE <a> tags — must handle each independently
 *   - Update CNN data attributes (data-open-link, data-zjs-card_name) to prevent
 *     CNN's own JavaScript from re-rendering the card with original content
 *   - Replace links by setting .href only — never touch innerHTML/textContent of <a> tags
 * V8.0.3: Remove CNN card label elements ("Analysis", "Opinion", "by Author") during image substitution
 * V8.0.4: Add keyword label in bottom-right corner of all substituted articles (image + text)
 */

const SubstitutionStrategies = {
  version: '8.0.4',

  // ============================================================================
  // SHARED HELPERS
  // ============================================================================

  /**
   * Apply clean green border indicator (used by all sites for substituted articles)
   */
  _addGreenBorder(element) {
    const bottleGreen = '#006A4E';
    
    // Remove any existing overlays/labels/loading overlays
    const existingOverlays = element.querySelectorAll(
      '.news-filter-overlay, .skeep-filter-label, .skeep-section-badge, .skeep-loading-overlay'
    );
    existingOverlays.forEach(el => el.remove());
    
    // Remove blur if present
    const blurWrapper = element.querySelector('.skeep-blur-wrapper');
    if (blurWrapper) {
      blurWrapper.style.filter = 'none';
    }
    
    // Add thin bottle green border only — completely clean design
    element.style.border = `2px solid ${bottleGreen}`;
    element.style.position = 'relative';
  },

  /**
   * Add a small keyword label in the bottom-right corner of a substituted article.
   * Matches the visual style of the blur overlay label but positioned bottom-right.
   * Called after _addGreenBorder() so position:relative is already set.
   */
  _addKeywordLabel(element, keyword) {
    if (!keyword) return;

    // Remove any previously injected keyword label on this element
    const existing = element.querySelector('.skeep-replaced-label');
    if (existing) existing.remove();

    const label = document.createElement('div');
    label.className = 'skeep-replaced-label';
    label.textContent = `Filtered: ${keyword}`;

    Object.assign(label.style, {
      position:        'absolute',
      bottom:          '6px',
      right:           '6px',
      backgroundColor: '#006A4E',
      color:           '#ffffff',
      fontSize:        '10px',
      fontWeight:      '600',
      fontFamily:      'sans-serif',
      lineHeight:      '1',
      padding:         '3px 6px',
      borderRadius:    '3px',
      zIndex:          '9999',
      pointerEvents:   'none',
      whiteSpace:      'nowrap',
      letterSpacing:   '0.3px',
    });

    // element must have position:relative (set by _addGreenBorder) for absolute positioning to work
    element.appendChild(label);
  },

  /**
   * Replace an <img> element's src, handling srcset, data-src, and lazy-loading attributes.
   * Also constrains the image to the original display dimensions to prevent layout shift.
   */
  _replaceImage(imgElement, newImageUrl, altText, originalDisplayWidth, originalDisplayHeight) {
    if (!imgElement || !newImageUrl) return false;

    try {
      // Store original display dimensions before any change
      const rect = imgElement.getBoundingClientRect();
      const origW = originalDisplayWidth || rect.width;
      const origH = originalDisplayHeight || rect.height;

      // Replace all image source attributes
      imgElement.src = newImageUrl;
      imgElement.alt = altText || '';

      // Clear srcset and data-src to prevent the browser from overriding our src
      if (imgElement.srcset) imgElement.srcset = '';
      if (imgElement.dataset.src) imgElement.dataset.src = newImageUrl;
      if (imgElement.dataset.lazySrc) imgElement.dataset.lazySrc = newImageUrl;

      // Also clear any <source> elements inside a parent <picture>
      const picture = imgElement.closest('picture');
      if (picture) {
        picture.querySelectorAll('source').forEach(source => {
          source.srcset = newImageUrl;
        });
      }

      // Constrain to original display dimensions to prevent layout shift
      if (origW > 0 && origH > 0) {
        imgElement.style.width = origW + 'px';
        imgElement.style.height = origH + 'px';
        imgElement.style.objectFit = 'cover';
        imgElement.style.maxWidth = '100%';
      }

      // Remove CNN's onerror handler to prevent CNN's imageLoadError from destroying the image
      imgElement.removeAttribute('onerror');
      imgElement.onerror = null;

      console.log(`[Strategy v8.0.1] Image replaced: ${origW}x${origH} -> ${newImageUrl.substring(0, 80)}...`);
      return true;
    } catch (error) {
      console.error('[Strategy v8.0.1] Image replacement failed:', error);
      return false;
    }
  },

  /**
   * Replace headline text, truncating if the replacement is longer than the original
   * to preserve card layout proportions.
   */
  _replaceHeadline(headlineElement, newTitle) {
    if (!headlineElement || !newTitle) return false;

    const originalText = headlineElement.textContent.trim();
    const originalLength = originalText.length;
    let newText = newTitle;

    // Truncate if significantly longer than original to preserve layout
    if (newText.length > originalLength && originalLength > 10) {
      newText = newText.substring(0, originalLength - 3) + '...';
      console.log(`[Strategy v8.0.1] Headline truncated to ${originalLength} chars`);
    }

    console.log(`[Strategy v8.0.1] Headline: "${originalText.substring(0, 40)}..." -> "${newText.substring(0, 40)}..."`);
    headlineElement.textContent = newText;
    return true;
  },

  /**
   * Replace link hrefs within the article element.
   * IMPORTANT: Only sets .href — never touches innerHTML or textContent of <a> tags.
   */
  _replaceLinks(element, newUrl, linkSelector) {
    if (!newUrl) return false;

    const links = element.querySelectorAll(linkSelector || 'a[href]');
    let replaced = 0;
    links.forEach(link => {
      link.href = newUrl;
      replaced++;
    });

    console.log(`[Strategy v8.0.1] Replaced ${replaced} link(s) -> ${newUrl.substring(0, 60)}...`);
    return replaced > 0;
  },


  // ============================================================================
  // CNN STRATEGY
  // ============================================================================

  'cnn.com': {
    name: 'CNN',
    
    // Text-only substitution (unchanged from v7.0.0)
    substitute(element, replacement, keyword) {
      console.log(`[CNN v${SubstitutionStrategies.version}] Text substitution`);
      
      try {
        const headline = element.querySelector(
          'span.container__headline-text, h3.container__headline, h2, h3, h4, [class*="headline"]'
        );
        if (headline) {
          SubstitutionStrategies._replaceHeadline(headline, replacement.title);
        }

        SubstitutionStrategies._replaceLinks(element, replacement.url, 'a.container__link, a[href*="/"]');
        SubstitutionStrategies._addGreenBorder(element);
        SubstitutionStrategies._addKeywordLabel(element, keyword);
        
        console.log(`[CNN] Text substitution complete`);
        return true;
      } catch (error) {
        console.error(`[CNN] Text substitution failed:`, error);
        return false;
      }
    },

    // V8.0.1: Image article substitution (DB-backed)
    // CNN uses a two-<a> card structure:
    //   First <a class="container__link">  -> wraps the entire image block (picture, source, img)
    //   Second <a class="container__link"> -> wraps the headline text (span.container__headline-text)
    // We must:
    //   1. Replace headline text inside the SECOND <a> (via span.container__headline-text)
    //   2. Replace image src inside the FIRST <a> (via img.image__dam-img)
    //   3. Update href on BOTH <a> tags individually (never set textContent on <a>)
    //   4. Update CNN data attributes to prevent CNN's JS from reverting our changes
    // V8.1.1: element may be the outer div.container.container_lead-package wrapper.
    //   In that case, find the inner li.card.container__item for DOM operations,
    //   but apply the visual border/label to the outer wrapper so the entire widget
    //   (title + image + headline) is visually covered.
    substituteWithImage(element, replacement, keyword) {
      console.log(`[CNN v${SubstitutionStrategies.version}] Image substitution (DB)`);
      
      try {
        // V8.1.1: If element is the outer container_lead-package wrapper, find the inner card
        const ec = element.className || '';
        let cardElement = element;
        if (ec.includes('container_lead-package') && !ec.includes('container_lead-package__')) {
          const innerCard = element.querySelector('li.card.container__item');
          if (innerCard) {
            cardElement = innerCard;
            console.log('[CNN] lead-package: using inner li.card for DOM operations');
          }
        }

        // Identify the two <a> tags in the CNN card
        const allLinks = cardElement.querySelectorAll('a.container__link');
        const imageLink = allLinks.length > 1 ? allLinks[0] : null;
        const headlineLink = allLinks.length > 1 ? allLinks[1] : allLinks[0];
        
        console.log(`[CNN] Found ${allLinks.length} container__link anchor(s)`);

        // Step 1: Replace headline text FIRST
        // Target the specific span inside the headline <a> — never set textContent on the <a> itself
        const headline = cardElement.querySelector('span.container__headline-text');
        if (headline) {
          SubstitutionStrategies._replaceHeadline(headline, replacement.title);
          console.log('[CNN] Headline span replaced');
        } else {
          // Fallback: look for headline only inside the headline link (second <a>)
          const searchScope = headlineLink || cardElement;
          const fallbackHeadline = searchScope.querySelector('h2, h3, h4, [class*="headline"]');
          if (fallbackHeadline) {
            SubstitutionStrategies._replaceHeadline(fallbackHeadline, replacement.title);
            console.log('[CNN] Headline replaced via fallback selector');
          }
        }

        // Step 2: Replace image inside the image <a> (first anchor)
        // Search within the media wrapper first, then fall back to the card element
        const imgContainer = cardElement.querySelector('.container__item-media-wrapper') || imageLink || cardElement;
        const img = imgContainer.querySelector('img.image__dam-img') || imgContainer.querySelector('picture img') || imgContainer.querySelector('img');
        if (img) {
          SubstitutionStrategies._replaceImage(img, replacement.imageUrl, replacement.title);
          console.log('[CNN] Image replaced');
          
          // Also update the data-url on the image wrapper div
          const imageDiv = cardElement.querySelector('div.image[data-url]');
          if (imageDiv) {
            imageDiv.dataset.url = replacement.imageUrl;
          }
        } else {
          console.warn('[CNN] No <img> element found in card');
        }

        // Step 3: Update href on each <a> individually — ONLY .href, nothing else
        if (imageLink) {
          imageLink.href = replacement.url;
        }
        if (headlineLink && headlineLink !== imageLink) {
          headlineLink.href = replacement.url;
        }
        
        // Step 4: Update CNN-specific data attributes to prevent CNN's JS from re-rendering
        // Update data-open-link on the <li> card element
        if (cardElement.dataset && cardElement.dataset.openLink !== undefined) {
          cardElement.dataset.openLink = replacement.url;
        }
        // Also check for data-open-link as a direct attribute
        if (cardElement.hasAttribute('data-open-link')) {
          cardElement.setAttribute('data-open-link', replacement.url);
        }
        // Also update the outer wrapper's data-collapsed-text and data-title if present
        if (element !== cardElement) {
          if (element.hasAttribute('data-collapsed-text')) element.setAttribute('data-collapsed-text', replacement.title);
          if (element.hasAttribute('data-title')) element.setAttribute('data-title', replacement.title);
        }
        
        // Update data-zjs-card_name on all <a> tags (CNN analytics attribute containing the title)
        allLinks.forEach(link => {
          if (link.hasAttribute('data-zjs-card_name')) {
            link.setAttribute('data-zjs-card_name', replacement.title);
          }
          // Also update data-zjs-canonical_url if present
          if (link.hasAttribute('data-zjs-canonical_url')) {
            link.setAttribute('data-zjs-canonical_url', replacement.url);
          }
        });
        // Also update the title link in the container__title div
        if (element !== cardElement) {
          const titleLink = element.querySelector('a.container__title-url');
          if (titleLink) {
            titleLink.href = replacement.url;
            const titleH2 = titleLink.querySelector('h2');
            if (titleH2) titleH2.textContent = replacement.title;
          }
        }

        // Update the image credit to remove original attribution
        const credit = cardElement.querySelector('figcaption.image__credit');
        if (credit) {
          credit.textContent = '';
        }

        // Step 5: Remove CNN card labels ("Analysis", "Opinion", "Breaking News", etc.)
        // These appear in two places:
        //   a) div.card__label-container (inside the image <a> tag)
        //   b) span.container__text-label (inside the headline <a> tag, includes "by Author" metadata)
        const labelContainers = element.querySelectorAll(
          '.card__label-container, .card__label, .container__text-label'
        );
        labelContainers.forEach(lbl => lbl.remove());
        console.log(`[CNN] Removed ${labelContainers.length} label element(s)`);

        // Step 6: Clean visual indicator + keyword label applied to the OUTER element
        // (covers the entire widget including title div + cards wrapper)
        SubstitutionStrategies._addGreenBorder(element);
        SubstitutionStrategies._addKeywordLabel(element, keyword);
        
        console.log(`[CNN] Image substitution complete`);
        return true;
      } catch (error) {
        console.error(`[CNN] Image substitution failed:`, error);
        return false;
      }
    },

    // Keep legacy method for backward compatibility
    addVisualIndicators(element, keyword, section) {
      SubstitutionStrategies._addGreenBorder(element);
    }
  },


  // ============================================================================
  // BBC STRATEGY
  // ============================================================================

  'bbc.com': {
    name: 'BBC',
    
    substitute(element, replacement, keyword) {
      console.log(`[BBC v${SubstitutionStrategies.version}] Text substitution`);
      
      try {
        const headline = element.querySelector(
          'h2[data-testid="card-headline"], h2, h3, [class*="headline"]'
        );
        if (headline) {
          SubstitutionStrategies._replaceHeadline(headline, replacement.title);
        }

        SubstitutionStrategies._replaceLinks(element, replacement.url, 'a[data-testid="internal-link"], a[href*="/"]');
        SubstitutionStrategies._addGreenBorder(element);
        SubstitutionStrategies._addKeywordLabel(element, keyword);
        
        console.log(`[BBC] Text substitution complete`);
        return true;
      } catch (error) {
        console.error(`[BBC] Text substitution failed:`, error);
        return false;
      }
    },

    substituteWithImage(element, replacement, keyword) {
      console.log(`[BBC v${SubstitutionStrategies.version}] Image substitution (DB)`);
      
      try {
        // Replace image
        const img = element.querySelector('img[data-testid="card-media"], img');
        SubstitutionStrategies._replaceImage(img, replacement.imageUrl, replacement.title);

        // Replace headline
        const headline = element.querySelector(
          'h2[data-testid="card-headline"], h2, h3, [class*="headline"]'
        );
        if (headline) {
          SubstitutionStrategies._replaceHeadline(headline, replacement.title);
        }

        // Replace links
        SubstitutionStrategies._replaceLinks(element, replacement.url, 'a[data-testid="internal-link"], a[href*="/"]');
        
        SubstitutionStrategies._addGreenBorder(element);
        SubstitutionStrategies._addKeywordLabel(element, keyword);
        
        console.log(`[BBC] Image substitution complete`);
        return true;
      } catch (error) {
        console.error(`[BBC] Image substitution failed:`, error);
        return false;
      }
    }
  },


  // ============================================================================
  // YAHOO STRATEGY
  // ============================================================================

  'yahoo.com': {
    name: 'Yahoo',
    
    substitute(element, replacement, keyword) {
      console.log(`[Yahoo v${SubstitutionStrategies.version}] Text substitution`);
      
      try {
        const headline = element.querySelector('h3, h2, [class*="headline"]');
        if (headline) {
          SubstitutionStrategies._replaceHeadline(headline, replacement.title);
        }

        SubstitutionStrategies._replaceLinks(element, replacement.url, 'a[href*="/"]');
        SubstitutionStrategies._addGreenBorder(element);
        SubstitutionStrategies._addKeywordLabel(element, keyword);
        
        console.log(`[Yahoo] Text substitution complete`);
        return true;
      } catch (error) {
        console.error(`[Yahoo] Text substitution failed:`, error);
        return false;
      }
    },

    substituteWithImage(element, replacement, keyword) {
      console.log(`[Yahoo v${SubstitutionStrategies.version}] Image substitution (DB)`);
      
      try {
        // Replace image (Yahoo uses <img> inside picture or directly)
        const img = element.querySelector('img');
        SubstitutionStrategies._replaceImage(img, replacement.imageUrl, replacement.title);

        // Replace headline
        const headline = element.querySelector('h2, h3, [class*="headline"]');
        if (headline) {
          SubstitutionStrategies._replaceHeadline(headline, replacement.title);
        }

        // Replace links
        SubstitutionStrategies._replaceLinks(element, replacement.url, 'a[href*="/"]');
        
        SubstitutionStrategies._addGreenBorder(element);
        SubstitutionStrategies._addKeywordLabel(element, keyword);
        
        console.log(`[Yahoo] Image substitution complete`);
        return true;
      } catch (error) {
        console.error(`[Yahoo] Image substitution failed:`, error);
        return false;
      }
    }
  },


  // ============================================================================
  // YNET STRATEGY (Hebrew/RTL)
  // ============================================================================

  'ynet.co.il': {
    name: 'Ynet',
    
    substitute(element, replacement, keyword) {
      console.log(`[Ynet v${SubstitutionStrategies.version}] Text substitution`);
      
      try {
        const headline = element.querySelector('.slotTitle, .title, h2, h3, [class*="title"]');
        if (headline) {
          SubstitutionStrategies._replaceHeadline(headline, replacement.title);
        }

        SubstitutionStrategies._replaceLinks(element, replacement.url, 'a.slotText, a[href*="/"]');
        SubstitutionStrategies._addGreenBorder(element);
        SubstitutionStrategies._addKeywordLabel(element, keyword);
        
        console.log(`[Ynet] Text substitution complete`);
        return true;
      } catch (error) {
        console.error(`[Ynet] Text substitution failed:`, error);
        return false;
      }
    },

    substituteWithImage(element, replacement, keyword) {
      console.log(`[Ynet v${SubstitutionStrategies.version}] Image substitution (DB)`);
      
      try {
        // Replace image (Ynet uses mediaArea or slotImage containers)
        const img = element.querySelector('.mediaArea img, .slotImage img, img');
        SubstitutionStrategies._replaceImage(img, replacement.imageUrl, replacement.title);

        // Replace headline
        const headline = element.querySelector('.slotTitle, .title, h2, h3, [class*="title"]');
        if (headline) {
          SubstitutionStrategies._replaceHeadline(headline, replacement.title);
        }

        // Replace links
        SubstitutionStrategies._replaceLinks(element, replacement.url, 'a.slotText, a[href*="/"]');
        
        SubstitutionStrategies._addGreenBorder(element);
        SubstitutionStrategies._addKeywordLabel(element, keyword);
        
        console.log(`[Ynet] Image substitution complete`);
        return true;
      } catch (error) {
        console.error(`[Ynet] Image substitution failed:`, error);
        return false;
      }
    },

    addVisualIndicatorsRTL(element, keyword, section) {
      SubstitutionStrategies._addGreenBorder(element);
    }
  },


  // ============================================================================
  // STRATEGY LOOKUP
  // ============================================================================

  getStrategy(site) {
    const domain = site.replace('www.', '').toLowerCase();
    
    // Exact match first
    if (this[domain]) return this[domain];
    
    // Bidirectional partial match:
    // handles 'cnn' matching 'cnn.com' AND 'cnn.com' matching 'cnn'
    for (const key of Object.keys(this)) {
      if (typeof this[key] === 'object' && this[key].name) {
        if (domain.includes(key) || key.includes(domain)) {
          return this[key];
        }
      }
    }
    
    return null;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.SubstitutionStrategies = SubstitutionStrategies;
}
