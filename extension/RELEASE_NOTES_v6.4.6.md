# News Filter v6.4.6 - Release Notes

## 🔢 Dynamic Version Display - Always Up-to-Date!

### Issue Fixed

#### Outdated Version in Popup Title ✅
**Problem:** Popup title showed "News Filter v6.2.1" even though the extension was v6.4.5.

**Root Cause:** The version number in `popup.html` was **hardcoded** and not updated with each release.

**Solution:** Made the version **dynamic** - it now automatically reads from `manifest.json` on every load.

---

## 🔧 Technical Changes

### Before (v6.4.5) - Hardcoded:
```html
<h1>News Filter v6.2.1</h1>  <!-- ❌ Never updated -->
```

### After (v6.4.6) - Dynamic:
```html
<h1 id="extension-title">News Filter</h1>  <!-- ✅ Populated by JavaScript -->
```

**New JavaScript in `popup.js`:**
```javascript
// Load and display extension version from manifest
function loadExtensionVersion() {
  const manifest = chrome.runtime.getManifest();
  const titleElement = document.getElementById('extension-title');
  if (titleElement && manifest.version) {
    titleElement.textContent = `News Filter v${manifest.version}`;
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
  loadExtensionVersion();
});
```

---

## ✅ What's New in v6.4.6

### Dynamic Version Display:
- ✅ Version automatically read from `manifest.json`
- ✅ Always shows correct version number
- ✅ No manual updates needed in future releases
- ✅ Single source of truth (manifest.json)

### Benefits:
- ✅ No more outdated version numbers
- ✅ Easier version management
- ✅ Consistent across extension

---

## 🧪 Testing Instructions

1. **Remove v6.4.5** from `chrome://extensions/`
2. **Extract and load** `news-filter-v6.4.6.zip` unpacked
3. **Open extension popup**
4. **Verify title shows:** "News Filter v6.4.6"
5. **Check manifest.json:**
   - Version should be `6.4.6`
6. **Verify they match!**

---

## 📊 All Sites Status - STABLE! 🎉

| Site | Sections | Service Worker | HTML Decoding | Version Display | Status |
|------|----------|----------------|---------------|-----------------|--------|
| **CNN** | 9 | ✅ | ✅ | ✅ **FIXED!** | ✅ Complete |
| **BBC** | 9 | ✅ | ✅ | ✅ **FIXED!** | ✅ Complete |
| **Ynet** | 12 | ✅ | ✅ | ✅ **FIXED!** | ✅ Complete |
| **Yahoo** | 5 | ✅ | ✅ | ✅ **FIXED!** | ✅ Complete |

**Total: 35 sections across 4 major news sites - ALL STABLE!** 🚀

---

## 🎯 Perfect Version Management

v6.4.6 now has:
- ✅ Dynamic version display
- ✅ Always accurate
- ✅ Single source of truth
- ✅ No manual updates needed

**Version number will always stay in sync from now on!** 🎊

---

## 🔍 Version History

### v6.4.6 (Current) - Dynamic Version Display
- ✅ Made popup title version dynamic
- ✅ Reads from manifest.json automatically
- ✅ Always shows correct version

### v6.4.5 - Service Worker Fixed
- ✅ Fixed syntax errors in extractors
- ✅ Service worker stable

### v6.4.4 - HTML Entity Decoding (BROKEN)
- ❌ Service worker crashed

### v6.4.3 - Yahoo Finance Fixed
- ✅ Triple-pattern extraction

### v6.4.2 - Yahoo Sports Fixed
- ✅ Dual-pattern extraction

### v6.4.1 - Yahoo URLs Fixed
- ✅ Multi-subdomain support

### v6.4.0 - Yahoo Extractor Implemented
- ✅ Yahoo site detection

### v6.3.0 - Ynet Complete
- ✅ Ynet sections fixed

### v6.2.9 - BBC Complete
- ✅ BBC extraction fixed

---

**Date:** January 25, 2026  
**Build:** Stable  
**Status:** Production Ready - Version Always Accurate! 🎉
