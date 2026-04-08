# News Filter v6.0.11 - Size-Based Container Prevention

## Release Date
January 6, 2026

## Version
6.0.11

## Status
Production Ready

---

## Objective

Fix the ynet.co.il over-highlighting issue by preventing overlays from being applied to large containers while allowing them on individual article cards.

---

## Problem

Overlays were being applied to both:
1. Individual slotView cards (200×113px) ✓
2. Parent containers (610×497px) ✗

This caused the entire container to be highlighted instead of just the individual article.

---

## Solution Implemented

Added **size-based prevention logic** to the `applyOverlay()` function:

```javascript
// V6.0.11 FIX: Size-based prevention for large containers
// Prevent overlays on containers larger than 300×200px (typical slotView size is ~200×113px)
const rect = element.getBoundingClientRect();
const width = rect.width;
const height = rect.height;

// If element is significantly larger than a typical article card, skip it
// slotView cards are ~200×113px, containers are ~610×497px
if (width > 300 || height > 200) {
  // Check if this is a container with multiple children (slotView elements)
  const slotViews = element.querySelectorAll('.slotView');
  if (slotViews.length > 1) {
    this.logger.log(`Skipping large container (${Math.round(width)}×${Math.round(height)}px) with ${slotViews.length} articles`);
    return false;  // Don't apply overlay to containers
  }
}
```

### How It Works

1. **Measure element size** using `getBoundingClientRect()`
   - Get width and height of the element

2. **Check size threshold**
   - If width > 300px OR height > 200px, it's likely a container

3. **Verify it's a container**
   - Check if it contains multiple `.slotView` children
   - If yes, skip the overlay (it's a container)
   - If no, apply the overlay (it's an individual card)

### Size Thresholds

- **Individual slotView card**: ~200×113px ✓ (Overlay applied)
- **Large container**: ~610×497px ✗ (Overlay skipped)
- **Threshold**: 300×200px (safe margin between card and container)

---

## Technical Details

### Modified Function

**Location**: `content.js`, lines 842-857

**Function**: `applyOverlay(element, keyword)`

**Changes**: 
- Added size measurement using `getBoundingClientRect()`
- Added container detection using `.slotView` children count
- Skip overlay if element is large container with multiple articles

```javascript
const rect = element.getBoundingClientRect();
const width = rect.width;
const height = rect.height;

if (width > 300 || height > 200) {
  const slotViews = element.querySelectorAll('.slotView');
  if (slotViews.length > 1) {
    return false;  // Skip large containers
  }
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.0.11 |
| content.js | Added size-based container prevention (lines 842-857) |
| popup.html | Version string updated to v6.0.11 |
| popup.js | Version string updated to v6.0.11 |

---

## Testing Verification

- ✅ Individual article cards are highlighted with red overlay
- ✅ Overlay covers only the specific article (200×113px)
- ✅ Large containers are NOT highlighted (610×497px)
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

## Improvements Over v6.0.10

| Aspect | v6.0.10 | v6.0.11 |
|--------|---------|---------|
| **Container Detection** | Attribute/DOM only | Size + children count |
| **Size Check** | None | 300×200px threshold |
| **Container Skipping** | No | Yes (if > threshold + multiple children) |
| **Over-highlighting** | Yes (containers covered) | No (containers skipped) |

---

## Backward Compatibility

- ✅ Fully backward compatible with v6.0.10
- ✅ No breaking changes to storage format
- ✅ Keywords and settings preserved
- ✅ CNN, BBC, Yahoo, and other sites unaffected

---

## Key Changes Summary

1. **Added size measurement**
   - Uses `getBoundingClientRect()` to get element dimensions

2. **Added container detection**
   - Checks for multiple `.slotView` children
   - Identifies containers vs individual cards

3. **Added size-based skipping**
   - Skips overlays on elements > 300×200px with multiple children
   - Allows overlays on smaller individual cards

4. **Maintained existing functionality**
   - All other overlay logic unchanged
   - Only added size-based prevention

---

## Installation

1. Extract `news-filter-v6.0.11.zip`
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
**Package Size**: 75 KB
**Compatibility**: Manifest V3 Compliant

The ynet.co.il over-highlighting issue is now completely resolved! 🎉
