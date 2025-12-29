# Phase 4 & Phase 2.5 Integration Guide
## News Filter Extension v5.0.0

**Date**: December 27, 2025  
**Status**: Implementation Guide  
**Version**: 5.0.0

---

## Overview

This guide explains how to integrate the new Phase 4 (Layout-Aware Substitution) and Phase 2.5 (Pre-emptive CSS Injection) modules into the existing News Filter extension.

### New Modules Created

#### Phase 4 Modules
1. **LayoutValidator** (`layoutValidator.js`) - Determines layout compatibility
2. **ReplacementPool** (`replacementPool.js`) - Manages safe articles for substitution
3. **SubstitutionManager** (`substitutionManager.js`) - Orchestrates substitution workflow
4. **ExternalFeedManager** (`externalFeedManager.js`) - Fetches articles from RSS/API
5. **PlaceholderTemplateManager** (`placeholderTemplateManager.js`) - Creates placeholder cards

#### Phase 2.5 Module
6. **CSSInjectionManager** (`cssInjectionManager.js`) - Pre-emptive CSS injection

#### Configuration
7. **siteStrategies_v5.js** - Updated site configurations with Phase 4 support

---

## Step-by-Step Integration

### Step 1: Update Manifest (manifest.json)

Update the manifest to support CSS injection at document_start:

```json
{
  "manifest_version": 3,
  "name": "News Filter v5.0.0",
  "version": "5.0.0",
  "description": "Filter news articles by keywords with layout-aware substitution",
  "permissions": [
    "storage",
    "tabs",
    "scripting",
    "alarms"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*",
    "https://raw.githubusercontent.com/*",
    "https://feeds.yahoo.com/*",
    "http://feeds.bbc.co.uk/*",
    "http://rss.cnn.com/*",
    "https://www.theguardian.com/*",
    "https://newsapi.org/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "images/icon16.png",
      "48": "images/icon48.png",
      "128": "images/icon128.png"
    }
  },
  "icons": {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  },
  "content_scripts": [
    {
      "matches": ["https://*/*", "http://*/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["images/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### Step 2: Update content/index.js

Import and integrate the new modules:

```javascript
// Add these imports at the top
import { CSSInjectionManager } from './modules/css/cssInjectionManager.js';
import { SubstitutionManager } from './modules/substitution/substitutionManager.js';

// In NewsFilterExtension constructor
constructor() {
  // ... existing code ...
  this.cssInjectionManager = null;
  this.substitutionManager = null;
}

// In init() method, after siteConfig is set
async init() {
  try {
    // Get site configuration
    const hostname = window.location.hostname;
    this.siteConfig = getSiteConfig(hostname);
    
    // Initialize Phase 2.5: CSS Injection
    this.cssInjectionManager = new CSSInjectionManager(this.siteConfig, { debug: DEFAULT_CONFIG.DEBUG });
    this.cssInjectionManager.injectPreemptiveCSS();
    
    // Initialize Phase 4: Substitution
    this.substitutionManager = new SubstitutionManager(this.siteConfig, { debug: DEFAULT_CONFIG.DEBUG });
    
    // ... rest of initialization ...
  }
}

// Update scanAndFilter() to use substitution
scanAndFilter() {
  if (!this.isEnabled || this.keywords.length === 0) {
    this.logger.log('Filtering disabled or no keywords set');
    return;
  }

  const articles = this.detector.findArticles(document);
  const headlines = this.detector.findHeadlines(document);

  // Initialize substitution pool with all articles
  if (this.substitutionManager) {
    this.substitutionManager.initializePool([...articles, ...headlines]);
  }

  let filteredCount = 0;
  const allElements = [...articles, ...headlines];

  allElements.forEach(element => {
    if (!this.detector.isProcessed(element)) {
      const matchedKeyword = this.filterCore.shouldFilter(element);
      if (matchedKeyword) {
        this.applyFilter(element, matchedKeyword);
        filteredCount++;
      } else {
        // Mark safe articles for CSS cleanup
        if (this.cssInjectionManager) {
          this.cssInjectionManager.markAsSafe(element);
        }
      }
      this.detector.markAsProcessed(element);
    }
  });

  // Clean up preemptive CSS
  if (this.cssInjectionManager) {
    this.cssInjectionManager.cleanupPreemptiveCSS();
    this.cssInjectionManager.injectCleanupCSS();
  }

  this.filteredCount = filteredCount;
  this.updatePopupCount();
}

// Update applyFilter() to use substitution
async applyFilter(element, keyword) {
  try {
    // Try Phase 4 substitution first
    if (this.substitutionManager) {
      const substituted = await this.substitutionManager.substitute(element, keyword);
      if (substituted) {
        this.trackFilteredArticle(element, keyword);
        return;
      }
    }

    // Fallback to overlay (current behavior)
    this.domManipulator.applyOverlay(element, keyword);
    this.trackFilteredArticle(element, keyword);
  } catch (error) {
    this.logger.error(`Failed to apply filter: ${error.message}`);
  }
}

// Update scanAddedNodes() for infinite scroll
scanAddedNodes(nodes) {
  if (!this.isEnabled || this.keywords.length === 0) {
    return;
  }

  let filteredCount = 0;

  nodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const articles = this.detector.findArticlesInNode(node);
      
      // Add new articles to substitution pool
      if (this.substitutionManager) {
        this.substitutionManager.addArticlesToPool(articles);
      }
      
      articles.forEach(article => {
        if (!this.detector.isProcessed(article)) {
          const matchedKeyword = this.filterCore.shouldFilter(article);
          if (matchedKeyword) {
            this.applyFilter(article, matchedKeyword);
            filteredCount++;
          } else {
            if (this.cssInjectionManager) {
              this.cssInjectionManager.markAsSafe(article);
            }
          }
          this.detector.markAsProcessed(article);
        }
      });
    }
  });

  if (filteredCount > 0) {
    this.filteredCount += filteredCount;
    this.updatePopupCount();
  }
}
```

### Step 3: Update Site Strategies

Replace the old `siteStrategies.js` with `siteStrategies_v5.js`:

```bash
# Backup old file
mv content/modules/config/siteStrategies.js content/modules/config/siteStrategies_backup.js

# Use new version
cp content/modules/config/siteStrategies_v5.js content/modules/config/siteStrategies.js
```

### Step 4: Create Module Directory Structure

```bash
# Create substitution module directory
mkdir -p content/modules/substitution

# Create css module directory
mkdir -p content/modules/css

# Copy new modules
cp content/modules/substitution/*.js content/modules/substitution/
cp content/modules/css/*.js content/modules/css/
```

### Step 5: Update DOM Utilities (if needed)

Ensure `utils/dom.js` has the `extractURL` function:

```javascript
export function extractURL(element) {
  if (!element) return null;

  try {
    // Try to find a link element
    const link = element.tagName === 'A' ? element : element.querySelector('a[href]');
    if (link && link.href) {
      return link.href;
    }

    // Try data attributes
    const url = element.getAttribute('data-url') || 
                element.getAttribute('href') || 
                element.getAttribute('data-href');
    
    if (url) {
      try {
        return new URL(url, window.location.href).href;
      } catch (e) {
        return url;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}
```

---

## Configuration Guide

### Enabling Phase 4 Substitution

In `siteStrategies.js`, configure substitution per site:

```javascript
'yahoo.com': {
  // ... existing config ...
  
  // Enable substitution
  substitution: {
    enabled: true,
    dimensionTolerance: { width: 0.20, height: 0.20 }, // ±20%
    aspectRatioTolerance: 0.15,
    maxPoolSize: 50,
    cacheExpiry: 5000
  },
  
  // Configure external feeds
  externalFeeds: {
    enabled: true,
    sources: [
      { type: 'rss', url: 'https://feeds.yahoo.com/news' }
    ],
    cacheTTL: 300000
  },
  
  // Configure placeholder
  placeholder: {
    variant: 'branded',
    backgroundColor: '#f5f5f5',
    textColor: '#333',
    message: 'Content filtered for your preference'
  }
}
```

### Dimension Tolerance Guidelines

- **Strict Grids (BBC, CNN)**: `±5%` - Tight layout constraints
- **Moderate Layouts (Guardian, NYT)**: `±10%` - Standard news layouts
- **Fluid Layouts (Yahoo, Medium)**: `±20%` - Responsive/flexible layouts

### External Feed Sources

#### RSS Feed
```javascript
{ type: 'rss', url: 'https://feeds.example.com/news' }
```

#### NewsAPI
```javascript
{ type: 'newsapi', apiKey: 'YOUR_API_KEY' }
```

---

## Testing Checklist

### Phase 2.5 (CSS Injection)

- [ ] No "flash of content" on page load
- [ ] Articles are hidden during initial scan
- [ ] Safe articles are revealed after scan completes
- [ ] Filtered articles remain hidden
- [ ] CSS is properly cleaned up

### Phase 4 (Substitution)

- [ ] Tier 1: Layout-aware replacement works (90%+ success)
- [ ] Tier 2: External feeds work when pool is empty
- [ ] Tier 3: Generic placeholders display correctly
- [ ] Tier 4: Skeleton loaders animate smoothly
- [ ] Tier 5: Hidden articles don't cause layout issues
- [ ] No visual duplication of articles
- [ ] Performance is acceptable (< 50ms per article)

### Sites to Test

- [ ] Yahoo News (infinite scroll, node recycling)
- [ ] BBC News (strict grid, grouped containers)
- [ ] CNN (card-based layout, video auto-play)
- [ ] The Guardian (DCR cards)
- [ ] Default fallback sites

---

## Performance Monitoring

### Key Metrics

1. **Substitution Success Rate**: Target > 85%
2. **Empty Pool Fallback**: Target < 5%
3. **Flash of Content**: Target 0 occurrences
4. **Performance Overhead**: Target < 50ms per page

### Logging

Enable debug logging in `content/modules/config/defaults.js`:

```javascript
export const DEFAULT_CONFIG = {
  DEBUG: true, // Set to true for detailed logging
  // ... other config ...
};
```

### Console Output

Look for these log messages:

```
✓ Tier 1 (Layout-Aware) succeeded
✓ Tier 2 (External Feed) succeeded
✓ Tier 3 (Generic Placeholder) succeeded
✓ Tier 4 (Skeleton Loader) succeeded
✓ Tier 5 (Element Concealment) succeeded
```

---

## Troubleshooting

### Issue: CSS Injection Not Working

**Solution**: Ensure `CSSInjectionManager.injectPreemptiveCSS()` is called early in initialization.

### Issue: No Substitutions Happening

**Solution**: 
1. Check if substitution is enabled in site config
2. Verify replacement pool has articles
3. Check layout validator tolerance settings

### Issue: External Feeds Not Loading

**Solution**:
1. Verify feed URLs are correct
2. Check browser console for CORS errors
3. Ensure API keys are valid (for NewsAPI)

### Issue: Performance Degradation

**Solution**:
1. Reduce `maxPoolSize` in site config
2. Increase `cacheExpiry` for layout validator
3. Disable external feeds if not needed

---

## Version History

### v5.0.0 (Current)
- Added Phase 4: Layout-Aware Substitution System
- Added Phase 2.5: Pre-emptive CSS Injection
- Added External Feed Manager for backup articles
- Added Placeholder Template Manager for branded cards
- Updated all site strategies with new configuration

### v4.9.0 (Previous)
- Red overlay filtering
- Basic article detection
- Keyword matching

---

## Next Steps

1. **Test on all supported sites** - Verify substitution and CSS injection work correctly
2. **Gather user feedback** - Monitor success rates and user satisfaction
3. **Optimize performance** - Fine-tune cache settings and tolerance thresholds
4. **Phase 5: Shadow DOM Isolation** - Make extension feel native to every site
5. **Phase 6: Testing & CI/CD** - Automated testing and deployment

---

## Support

For issues or questions, refer to:
- `Phase4_Revised_Architecture.md` - Detailed architecture documentation
- `TESTING_GUIDE.md` - Comprehensive testing procedures
- Console logs with `DEBUG: true` for troubleshooting
