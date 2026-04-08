# News Filter v6.0.7 - Ynet.co.il Container Detection Fix

## Release Date
January 5, 2026

## Version
6.0.7

## Status
Production Ready

---

## Objective

Fix the ynet.co.il over-highlighting issue by properly detecting multi-article containers so the overlay is applied to individual article cards, not entire containers.

---

## Root Cause Identified

The issue was **NOT with the selectors** - it was with **container detection logic**.

### The Problem Flow

1. Extension finds keyword in a `slotView` article card ✓
2. Extension calls `findProperArticleContainer()` to find the right element to highlight
3. Function traverses UP the DOM looking for a "proper article container"
4. Function doesn't recognize `layoutItem multi-strip-lines` as a **stream wrapper** ✗
5. Function keeps traversing up and returns the container instead of the card ✗
6. Overlay is applied to the entire 610×497px container instead of the 200×113px card ✗

### Why This Happened

The `isStreamWrapper()` function checks for known container patterns (CNN, BBC, generic patterns) but **did not include ynet-specific patterns** like `multi-strip-lines` and `YnetMultiStripRowsComponenta`.

---

## Solution Implemented

### Added Ynet Stream Wrapper Patterns

Added three new patterns to the `streamWrapperPatterns` array in `isStreamWrapper()`:

```javascript
const streamWrapperPatterns = [
  // V6.0.7 FIX: Ynet.co.il patterns
  'multi-strip-lines',      // Ynet multi-article strip container
  'YnetMultiStripRowsComponenta',  // Ynet strip layout wrapper
  'mivzak',                 // Ynet news ticker
  // ... existing patterns ...
];
```

### How It Works Now

1. Extension finds keyword in a `slotView` article card ✓
2. Extension calls `findProperArticleContainer()` ✓
3. Function traverses UP the DOM ✓
4. Function finds `layoutItem multi-strip-lines` ✓
5. Function checks `isStreamWrapper()` ✓
6. `isStreamWrapper()` recognizes `multi-strip-lines` pattern ✓
7. Function **stops traversing** and returns the original `slotView` card ✓
8. Overlay is applied to the 200×113px card, not the container ✓

---

## Technical Details

### Modified Function

**Location**: `content.js`, lines 1362-1397

**Function**: `isStreamWrapper(element)`

**Change**: Added ynet patterns to `streamWrapperPatterns` array

### Pattern Explanations

| Pattern | Purpose | Example |
|---------|---------|---------|
| `multi-strip-lines` | Main ynet strip container | `class="layoutItem multi-strip-lines"` |
| `YnetMultiStripRowsComponenta` | Ynet strip layout wrapper | `class="YnetMultiStripRowsComponenta colorBackground"` |
| `mivzak` | Ynet news ticker | `class="mivzak"` or `ul.mivzak` |

---

## Files Modified

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.0.7 |
| content.js | Added ynet patterns to streamWrapperPatterns array (lines 1369-1371) |
| popup.html | Version string updated to v6.0.7 |
| popup.js | Version string updated to v6.0.7 |

---

## Testing Verification

- ✅ Individual article cards are highlighted correctly
- ✅ Overlay covers only the specific article (200×113px), not container (610×497px)
- ✅ Multiple articles in same container work correctly
- ✅ Featured article section highlights properly
- ✅ Related articles grid highlights individual cards
- ✅ News list items highlight individually
- ✅ Opinion section articles highlight correctly
- ✅ News Ticker (Mivzakim) items highlight correctly
- ✅ Commercial/sponsored content is excluded
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

## Improvements Over v6.0.6

| Aspect | v6.0.6 | v6.0.7 |
|--------|--------|--------|
| Container Detection | Missing ynet patterns | Includes ynet patterns |
| Overlay Target | Entire container | Individual card |
| Overlay Size | 610×497px | 200×113px |
| Over-highlighting | Yes (entire containers) | No (individual cards only) |
| Stream Wrapper Recognition | Incomplete | Complete for ynet |

---

## Backward Compatibility

- ✅ Fully backward compatible with v6.0.6
- ✅ No breaking changes to storage format
- ✅ Keywords and settings preserved
- ✅ Existing articles in storage still work

---

## Key Insight

The fix demonstrates an important principle: **proper container detection is as important as proper element selection**. Even with correct selectors, if the container detection logic doesn't recognize multi-article containers, the overlay will be applied to the wrong element.

---

## Installation

1. Extract `news-filter-v6.0.7.zip`
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
