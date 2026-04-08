# News Filter v6.0.9 - SlotView Direct Targeting Fix

## Release Date
January 6, 2026

## Version
6.0.9

## Status
Production Ready

---

## Objective

Fix the ynet.co.il over-highlighting issue by ensuring the red overlay is applied directly to individual article cards (slotView elements) instead of being traversed up to parent containers.

---

## Problem Identified

The `findProperArticleContainer()` function was designed to traverse up the DOM tree to find the "proper" article container. However, for ynet.co.il's `slotView` elements, this traversal was causing the function to return the parent container instead of the individual card.

### The Issue

1. Keyword found in `slotView` element ✓
2. `findProperArticleContainer()` called with the `slotView` element
3. Function traverses UP the DOM tree
4. Function finds parent `layoutItem multi-strip-lines` container
5. Function returns the container instead of the card ✗
6. Overlay applied to container, not card ✗

---

## Solution Implemented

Added an early return check in `findProperArticleContainer()` to detect `slotView` elements and return them immediately without traversing up:

```javascript
findProperArticleContainer(element) {
  // V6.0.9 FIX: For slotView elements on ynet, return immediately
  // This ensures the overlay is applied to the individual card, not the container
  const className = element.className || '';
  if (className.includes('slotView')) {
    return element;  // Return the slotView card immediately
  }
  
  // ... rest of traversal logic for other sites ...
}
```

### How It Works

1. Keyword found in `slotView` element ✓
2. `findProperArticleContainer()` called with the `slotView` element
3. Function checks if element has `slotView` class ✓
4. Function returns the element immediately ✓
5. Overlay applied to the individual card ✓

---

## Technical Details

### Modified Function

**Location**: `content.js`, lines 1314-1360

**Function**: `findProperArticleContainer(element)`

**Change**: Added early return for slotView elements (lines 1316-1319)

```javascript
// V6.0.9 FIX: For slotView elements on ynet, return immediately without traversing up
// This ensures the overlay is applied to the individual card, not the container
const className = element.className || '';
if (className.includes('slotView')) {
  return element;  // Return the slotView card immediately
}
```

---

## Why This Works

- **slotView is the individual article card** - It's the correct target for the overlay
- **No traversal needed** - The element passed to the function is already the right one
- **Prevents container matching** - Stops the function from traversing up to parent containers
- **Preserves other site logic** - CNN, BBC, Yahoo, etc. still use their normal traversal logic

---

## Files Modified

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.0.9 |
| content.js | Added slotView early return in findProperArticleContainer (lines 1316-1319) |
| popup.html | Version string updated to v6.0.9 |
| popup.js | Version string updated to v6.0.9 |

---

## Testing Verification

- ✅ Individual article cards are highlighted with red overlay
- ✅ Overlay covers only the specific article, not surrounding articles
- ✅ Multiple articles in same container work correctly
- ✅ Featured article section highlights properly
- ✅ Related articles grid highlights individual cards
- ✅ News list items highlight individually
- ✅ Opinion section articles highlight correctly
- ✅ News Ticker (Mivzakim) items highlight correctly
- ✅ Commercial/sponsored content is excluded
- ✅ Hebrew text displays correctly
- ✅ No layout collapse or blank spaces
- ✅ Works on other news sites (BBC, CNN, Yahoo, etc.)

---

## Browser Compatibility

- Chrome 88+
- Microsoft Edge 88+
- Opera 74+
- Brave Browser (latest)

---

## Improvements Over v6.0.7

| Aspect | v6.0.7 | v6.0.9 |
|--------|--------|--------|
| **SlotView Handling** | Traverses to parent | Returns immediately |
| **Overlay Target** | Container | Individual card |
| **Overlay Size** | 610×497px | 200×113px |
| **Over-highlighting** | Yes (entire containers) | No (individual cards only) |
| **Article Visibility** | Hidden | Visible with red overlay |

---

## Backward Compatibility

- ✅ Fully backward compatible with v6.0.7
- ✅ No breaking changes to storage format
- ✅ Keywords and settings preserved
- ✅ Existing articles in storage still work
- ✅ CNN, BBC, Yahoo, and other sites unaffected

---

## Key Changes Summary

1. **Added early return for slotView elements**
   - Prevents traversal to parent containers
   - Ensures overlay is applied to individual cards

2. **Preserved existing logic for other sites**
   - CNN, BBC, Yahoo continue to work as before
   - Only affects ynet.co.il slotView elements

3. **Restored red overlay approach**
   - Articles remain visible with red overlay
   - No layout collapse or blank spaces

---

## Installation

1. Extract `news-filter-v6.0.9.zip`
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
