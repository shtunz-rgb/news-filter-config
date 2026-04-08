# News Filter v6.1.1 Release Notes

**Release Date**: January 8, 2026  
**Status**: Production Ready  
**Type**: Bug Fix Release

---

## 🔧 Issues Fixed

### 1. Section Feature Position
- **Problem**: CNN Sections feature was appearing above the "Filtered (This Site)" section
- **Fix**: Moved section feature to the bottom of the popup, below the filtered articles drawer

### 2. Section Buttons Not Appearing
- **Problem**: Section buttons (World, Politics, Business, etc.) were not displaying
- **Root Cause**: JavaScript was trying to dynamically populate buttons via message passing, but the background script wasn't loading the section fetcher files
- **Fix**: 
  - Added `importScripts()` in background.js to load section fetcher files
  - Added inline section buttons in HTML as fallback
  - Updated JavaScript to attach click handlers to existing buttons

### 3. Drawer Showing Prematurely
- **Problem**: Section drawer with "0" count was visible before any section was selected
- **Fix**: Drawer is now hidden by default and only appears when user clicks a section button

### 4. Encoding Issues
- **Problem**: Arrow characters (▼, ↻) were displaying as garbled text (â–¼, ât»)
- **Fix**: 
  - Added `<meta charset="UTF-8">` to popup.html
  - Replaced Unicode characters with HTML entities (&#9660;, &#8635;)

---

## 📊 Changes Summary

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.1.1 |
| popup.html | Section feature moved to bottom, UTF-8 charset added, inline buttons added |
| background.js | Added importScripts for section fetcher files |
| section-articles-popup.js | Rewritten to work with inline buttons, hide drawer initially |
| cnn-sections-config.js | Version string updated |
| section-articles-fetcher.js | Version string updated |
| popup.js | Version string updated |

---

## ✅ Testing Verification

- ✅ Section buttons display correctly (8 buttons: World, Politics, Business, Health, Entertainment, Style, Travel, Sports)
- ✅ Section feature appears at the bottom of popup
- ✅ Drawer is hidden until section is selected
- ✅ Arrow characters display correctly
- ✅ Clicking a section button fetches and displays articles
- ✅ Filtered articles drawer still works correctly
- ✅ All existing functionality preserved

---

## 🚀 Installation

1. Extract `news-filter-v6.1.1.zip`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the folder
5. Extension is ready to use

---

## 🔄 Backward Compatibility

- ✅ Fully backward compatible with v6.1.0
- ✅ No breaking changes to storage format
- ✅ Keywords and settings preserved
- ✅ Existing filtering functionality unaffected

---

**Version**: 6.1.1  
**Package Size**: ~85 KB  
**Compatibility**: Manifest V3 Compliant
