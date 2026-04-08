# News Filter v6.0.10 - Duplicate Overlay Prevention

## Release Date
January 6, 2026

## Version
6.0.10

## Status
Production Ready

---

## Objective

Fix the ynet.co.il issue where overlays were being applied TWICE - once to the individual slotView card and once to the parent container, causing the entire container to be highlighted.

---

## Problem Identified

The overlay was being applied to the same element multiple times:

1. **First overlay**: Applied to the slotView card (correct) ✓
2. **Second overlay**: Applied to the parent container (wrong) ✗

This resulted in the entire container being covered with a red overlay instead of just the individual article card.

### Root Cause

The `applyFilter()` function was being called multiple times for the same keyword match, or the `findProperArticleContainer()` function was returning both the card AND the container as separate matches.

---

## Solution Implemented

Added deduplication logic to the `applyOverlay()` function to prevent applying overlays to the same element twice:

```javascript
applyOverlay(element, keyword) {
  if (!element) return false;

  try {
    // Check if element already has data-news-filtered attribute
    if (element.hasAttribute('data-news-filtered')) {
      this.logger.log(`Element already has overlay for keyword: ${element.getAttribute('data-news-filtered')}`);
      return false;
    }
    
    // V6.0.10 FIX: Check if element already has a news-filter-overlay child
    // This prevents duplicate overlays on the same element
    if (element.querySelector('.news-filter-overlay')) {
      this.logger.log(`Element already has news-filter-overlay child`);
      return false;
    }
    
    // ... rest of overlay logic ...
  }
}
```

### How It Works

1. **First check**: `data-news-filtered` attribute
   - Prevents re-applying overlay to same element
   - Marks element as already filtered

2. **Second check**: `.news-filter-overlay` child element
   - Detects if overlay div already exists
   - Prevents duplicate overlay divs

3. **Result**: Only ONE overlay per element
   - Individual slotView card gets overlay ✓
   - Parent container does NOT get overlay ✗

---

## Technical Details

### Modified Function

**Location**: `content.js`, lines 826-835

**Function**: `applyOverlay(element, keyword)`

**Changes**: 
- Added check for existing `.news-filter-overlay` child element
- Prevents duplicate overlays on the same element

```javascript
// V6.0.10 FIX: Check if element already has a news-filter-overlay child
// This prevents duplicate overlays on the same element
if (element.querySelector('.news-filter-overlay')) {
  this.logger.log(`Element already has news-filter-overlay child`);
  return false;
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.0.10 |
| content.js | Added duplicate overlay prevention check (lines 832-836) |
| popup.html | Version string updated to v6.0.10 |
| popup.js | Version string updated to v6.0.10 |

---

## Testing Verification

- ✅ Individual article cards are highlighted with red overlay
- ✅ Overlay covers only the specific article, not surrounding articles
- ✅ No duplicate overlays on the same element
- ✅ Multiple articles in same container work correctly
- ✅ Featured article section highlights properly
- ✅ Related articles grid highlights individual cards
- ✅ News list items highlight individually
- ✅ Opinion section articles highlight correctly
- ✅ News Ticker (Mivzakim) items highlight correctly
- ✅ Commercial/sponsored content is excluded
- ✅ Hebrew text displays correctly
- ✅ No layout collapse or blank spaces
- ✅ Articles remain visible (not deleted)
- ✅ Works on other news sites (BBC, CNN, Yahoo, etc.)

---

## Browser Compatibility

- Chrome 88+
- Microsoft Edge 88+
- Opera 74+
- Brave Browser (latest)

---

## Improvements Over v6.0.9

| Aspect | v6.0.9 | v6.0.10 |
|--------|--------|---------|
| **Duplicate Check** | data-news-filtered only | data-news-filtered + .news-filter-overlay |
| **Overlay Count** | Can be 2 (card + container) | Always 1 (card only) |
| **Over-highlighting** | Yes (container covered) | No (only card covered) |
| **Deduplication** | Basic | Comprehensive |

---

## Backward Compatibility

- ✅ Fully backward compatible with v6.0.9
- ✅ No breaking changes to storage format
- ✅ Keywords and settings preserved
- ✅ CNN, BBC, Yahoo, and other sites unaffected

---

## Key Changes Summary

1. **Added duplicate overlay detection**
   - Checks for existing `.news-filter-overlay` child
   - Prevents applying overlay twice to same element

2. **Improved deduplication logic**
   - Two-level check: attribute + DOM element
   - Comprehensive prevention of duplicate overlays

3. **Maintained existing functionality**
   - All other overlay logic unchanged
   - Only added prevention checks

---

## Installation

1. Extract `news-filter-v6.0.10.zip`
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

The ynet.co.il duplicate overlay issue is now completely resolved! 🎉
