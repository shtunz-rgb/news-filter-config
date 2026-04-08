# News Filter Extension v6.0.4 - Release Notes

**Release Date**: January 3, 2026  
**Version**: 6.0.4  
**Status**: Production Ready  
**Focus**: Ynet.co.il selector fix - refined selectors to prevent overlay on entire containers

---

## 🎯 The Problem on ynet.co.il

The extension was applying the red overlay to the **entire article container** instead of just the specific article element. This was a classic **selector overmatch** issue.

**Why it happened**:
- The selectors were matching large parent/wrapper containers that held multiple articles
- The overlay was being applied to a large container that also contained the keyword
- This was a **false positive** - the selectors were too broad

---

## ✅ The Fix (v6.0.4)

**Refined selectors for ynet.co.il**:

I have added a new site-specific configuration for ynet.co.il with refined selectors that:
1. Target only individual article items
2. Avoid matching large container wrappers
3. Use more specific CSS selectors to differentiate between them

### New Configuration

In `content.js`, I added the following configuration to `SITE_STRATEGIES`:

```javascript
  'ynet.co.il': {
    articleSelectors: [
      'div.layoutItem.multi-article-1280-2:not(.show-small-vp)',
      'div.layoutItem.multi-article-rows-1280:not(.show-small-vp)',
      'div.layoutItem.multi-article-top-1280:not(.show-small-vp)',
      'div.layoutItem.article-promo:not(.show-small-vp)',
      'div.layoutItem.multi-article-images-1280-2:not(.show-small-vp)',
      'div[class*="layoutItem"][class*="article"]',
      'div[class*="layoutItem"][class*="multi"]',
      'article',
      '.article'
    ],
    headlineSelectors: [
      'h1', 'h2', 'h3', 'h4',
      '[class*="headline"]',
      '[class*="title"]',
      'a[href]'
    ],
    substitutionMode: 'overlay',
    priority: 9,
    notes: 'Ynet.co.il Hebrew news site'
  },
```

**What these selectors do**:
- `div.layoutItem.multi-article-*` - Targets the specific article layout items
- `:not(.show-small-vp)` - Excludes mobile-specific containers
- `div[class*="layoutItem"][class*="article"]` - Catches other article-like items

---

## 📊 Results

| Issue | Before | After |
|-------|--------|-------|
| Overlay on ynet.co.il | ✗ Incorrect (large containers) | ✓ Correct (individual articles) |
| False positives | ✗ High | ✓ Low |
| Highlighting | ✓ Working | ✓ Working |
| Drawer display | ✓ Working | ✓ Working |

---

## 📦 Package Contents

**File**: `news-filter-v6.0.4.zip`

### Core Files
- **manifest.json** - v6.0.4 configuration
- **content.js** - Added ynet.co.il site strategy
- **popup.js** - v6.0.4 version string
- **popup.html** - v6.0.4 version string
- **background.js** - Unchanged
- **images/** - Extension icons

### Documentation
- **RELEASE_NOTES_v6.0.4.md** - This release

---

## 🚀 Installation

### Fresh Installation
1. Extract `news-filter-v6.0.4.zip`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extracted folder

### Upgrade from v6.0.3
1. Download `news-filter-v6.0.4.zip`
2. Extract to a folder
3. Go to `chrome://extensions/`
4. Remove News Filter v6.0.3
5. Click "Load unpacked" and select v6.0.4
6. Keywords are automatically preserved ✅

---

## ✅ Testing Verification

- ✅ Overlay now applies to individual articles on ynet.co.il
- ✅ No more large red boxes covering entire sections
- ✅ Highlighting works correctly on other sites (BBC, CNN, etc.)
- ✅ Drawer functionality is preserved
- ✅ No performance degradation

---

## 📋 Files Modified

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.0.4 |
| content.js | Added ynet.co.il site strategy |
| popup.html | Version string updated |
| popup.js | Version string updated |

---

## 🔮 Future Improvements

- **v6.0.5**: Add timestamp sorting for articles (Today, Yesterday, etc.)
- **v6.1.0**: Add article preview on hover
- **v6.2.0**: Add article filtering by keyword in drawer
- **v7.0.0**: Add statistics dashboard

---

**Version**: 6.0.4  
**Release Date**: January 3, 2026  
**Status**: Production Ready  

The ynet.co.il selector issue is now resolved! 🎉
