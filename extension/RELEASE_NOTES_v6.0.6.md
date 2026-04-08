# News Filter v6.0.6 - Ynet.co.il Comprehensive Fix

## Release Date
January 5, 2026

## Version
6.0.6

## Status
Production Ready

---

## Objective

Fix the ynet.co.il over-highlighting issue where entire multi-article containers were being highlighted instead of individual article cards. Also add support for News Ticker (Mivzakim) and Video/Gallery strips, with complete exclusion of commercial/sponsored content.

---

## Problem Identified

**Issue**: When filtering articles on ynet.co.il, the red overlay was covering entire sections containing multiple articles instead of just the specific article containing the filtered keyword.

**Root Cause**: The selectors were matching large parent container divs (`layoutItem multi-strip-lines`) that held multiple individual article cards (`slotView`), rather than targeting the individual article cards themselves.

**Example**: 
- Before: Entire container (610×497px) with 4 articles gets covered with one overlay
- After: Only the specific article card (200×113px) with the filtered keyword gets covered

---

## Solution Implemented

### 1. Primary Selector: SlotView Cards

**New Primary Selector**:
```css
div.slotView:not(.commertial)  /* Individual article cards, excludes commercial */
div.slotView                    /* Fallback for all slotView cards */
```

**Why This Works**:
- `slotView` is the actual individual article card element
- Each card is ~200×113px (correct size for highlighting)
- Contains the image, headline, and subtitle
- Only one card per article

### 2. Commercial Content Exclusion

**Implementation**:
```css
div.slotView:not(.commertial)  /* Excludes class="commertial" (note: typo in ynet HTML) */
```

**Effect**:
- Sponsored/promotional content is completely excluded from filtering
- No overlays applied to commercial articles regardless of keyword match

### 3. News Ticker (Mivzakim) Support

**New Selectors**:
```css
ul.mivzak > li              /* News ticker list items */
div.mivzak > li             /* Alternative mivzak structure */
div[class*="mivzak"] > li   /* Generic mivzak containers */
li[class*="mivzak"]         /* Fallback for mivzak items */
```

**Coverage**:
- Supports both `ul > li` and `div > li` structures
- Handles various mivzak class naming patterns
- Properly highlights individual ticker items

### 4. Video/Gallery Strip Support

**Selectors**:
```css
div.layoutItem.multi-article-1280-2:not(:has(> div.layoutItem))
div.layoutItem.multi-article-rows-1280:not(:has(> div.layoutItem))
div.layoutItem.multi-article-top-1280:not(:has(> div.layoutItem))
div.layoutItem.article-promo:not(:has(> div.layoutItem))
div.layoutItem.multi-article-images-1280-2:not(:has(> div.layoutItem))
```

**Features**:
- Proper overlay alignment for video/gallery strips
- Avoids matching container wrappers
- Handles "Next/Prev" button masking issues

---

## HTML Structure Analysis

### Before (v6.0.5) - WRONG
```
layoutItem multi-strip-lines (610×497px) ← ENTIRE CONTAINER HIGHLIGHTED
├── YnetMultiStripRowsComponenta
│   ├── slotView (Article 1 - no keyword)
│   ├── slotView (Article 2 - HAS keyword) ✓
│   ├── slotView (Article 3 - no keyword)
│   └── slotView (Article 4 - no keyword)
```

### After (v6.0.6) - CORRECT
```
layoutItem multi-strip-lines (610×497px) ← NOT HIGHLIGHTED
├── YnetMultiStripRowsComponenta
│   ├── slotView (Article 1 - no keyword) ← NOT HIGHLIGHTED
│   ├── slotView (Article 2 - HAS keyword) ← HIGHLIGHTED ONLY ✓
│   ├── slotView (Article 3 - no keyword) ← NOT HIGHLIGHTED
│   └── slotView (Article 4 - no keyword) ← NOT HIGHLIGHTED
```

---

## Files Modified

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.0.6 |
| content.js | Ynet.co.il selectors completely refactored |
| popup.html | Version string updated to v6.0.6 |
| popup.js | Version string updated to v6.0.6 |

---

## Selector Hierarchy (Priority Order)

1. **Primary**: `div.slotView:not(.commertial)` - Individual article cards
2. **Fallback 1**: `div.slotView` - All slotView cards
3. **News Ticker**: `ul.mivzak > li`, `div.mivzak > li` - Ticker items
4. **Video/Gallery**: `div.layoutItem.multi-article-*` - Strip containers
5. **Generic**: `div[class*="layoutItem"]` - Other article types

---

## Testing Verification

- ✅ Individual article cards are highlighted correctly
- ✅ Overlay covers only the specific article, not surrounding articles
- ✅ Featured article section highlights properly
- ✅ Related articles grid highlights individual cards
- ✅ News list items highlight individually
- ✅ Opinion section articles highlight correctly
- ✅ News Ticker (Mivzakim) items highlight correctly
- ✅ Video/Gallery strips highlight with proper alignment
- ✅ Commercial/sponsored content is never highlighted
- ✅ Hebrew text displays correctly
- ✅ No performance degradation
- ✅ Works on other news sites (BBC, CNN, Yahoo, etc.)

---

## Browser Compatibility

- Chrome 88+
- Microsoft Edge 88+
- Opera 74+
- Brave Browser (latest)

---

## Improvements Over v6.0.5

| Aspect | v6.0.5 | v6.0.6 |
|--------|--------|--------|
| Primary Selector | Container-based | SlotView-based (individual cards) |
| Commercial Content | Not excluded | Completely excluded |
| News Ticker Support | Not supported | Fully supported |
| Video/Gallery Support | Basic | Enhanced with alignment fixes |
| Overlay Precision | Container-level | Card-level |
| Over-highlighting | Yes (entire containers) | No (individual cards only) |

---

## Backward Compatibility

- ✅ Fully backward compatible with v6.0.5
- ✅ No breaking changes to storage format
- ✅ Keywords and settings preserved
- ✅ Existing articles in storage still work

---

## Key Changes Summary

1. **Replaced container-based selectors with card-based selectors**
   - From: `layoutItem multi-strip-lines`
   - To: `slotView` (individual cards)

2. **Added commercial content exclusion**
   - Sponsored content never highlighted
   - Improves user experience by filtering only editorial content

3. **Added News Ticker support**
   - Handles `ul.mivzak > li` structures
   - Handles `div.mivzak > li` structures
   - Supports various class naming patterns

4. **Improved Video/Gallery support**
   - Better overlay alignment
   - Handles wrapper styling issues
   - Supports "Next/Prev" button scenarios

---

## Installation

1. Extract `news-filter-v6.0.6.zip`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the folder
5. Extension is ready to use

---

## Support

For issues or questions:
1. Check README.md for general documentation
2. Review troubleshooting sections
3. Check TECHNICAL_SUMMARY.md for technical details

---

**Status**: Production Ready
**Package Size**: 65 KB
**Compatibility**: Manifest V3 Compliant

The ynet.co.il over-highlighting issue is now completely resolved! 🎉
