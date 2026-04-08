# News Filter Extension v6.0.3 - Release Notes

**Release Date**: January 3, 2026  
**Version**: 6.0.3  
**Status**: Production Ready  
**Focus**: Minimal fix to drawer article display - reverted to v4.9.0 baseline with surgical fix

---

## 🔄 What Happened

After releasing v6.0.0, v6.0.1, and v6.0.2, we discovered that the refactoring had introduced breaking changes that worsened the highlighting functionality while still not fixing the drawer issue properly.

**Decision**: Revert to v4.9.0 baseline and apply only a minimal, surgical fix to the drawer issue.

---

## 🔍 Root Cause Analysis

The drawer issue was **already present in v4.9.0**. The problem was:

1. Articles were being detected correctly ✓
2. Articles were being highlighted on the page ✓
3. Articles were being saved to storage ✓
4. **BUT articles were NEVER being sent to the popup** ✗

The popup was listening for `message.type === 'articleFiltered'` messages, but content.js was never sending them. The drawer could only display articles if manually loaded from storage on page load, not dynamically as they were filtered.

---

## ✅ The Fix (v6.0.3)

**Minimal surgical fix**: Added article messaging to `StorageManager.processQueue()` in content.js.

### Code Change

In `content.js`, after saving an article to storage, we now send it to the popup:

```javascript
// V6.0.3 FIX: Send article to popup for drawer display
try {
  chrome.runtime.sendMessage({
    type: 'articleFiltered',
    article: article
  }).catch(() => {
    // Popup not open, that's okay
  });
} catch (error) {
  this.logger.log(`Could not send article to popup: ${error.message}`);
}
```

**That's it.** No other changes. This ensures:
- ✅ Highlighting still works (unchanged from v4.9.0)
- ✅ Article detection still works (unchanged from v4.9.0)
- ✅ Articles are now sent to popup for drawer display (NEW)

---

## 📊 What's Different from v4.9.0

| Component | v4.9.0 | v6.0.3 |
|-----------|--------|--------|
| Highlighting | ✓ Working | ✓ Working (unchanged) |
| Article Detection | ✓ Working | ✓ Working (unchanged) |
| Storage | ✓ Working | ✓ Working (unchanged) |
| Drawer Display | ✗ Broken | ✓ Fixed |
| Message Sending | ✗ Missing | ✓ Added |

---

## 🎯 Issues Fixed

- **Issue #16**: Articles not sent to popup - FIXED
- **Issue #17**: Only count sent, not individual articles - FIXED
- **Issue #18**: Drawer only shows one article - FIXED

---

## ✅ What's Preserved

- ✅ All highlighting functionality from v4.9.0
- ✅ All article detection logic from v4.9.0
- ✅ All storage functionality from v4.9.0
- ✅ All remote configuration support
- ✅ All site-specific selectors (BBC, CNN, Yahoo, etc.)
- ✅ Infinite scroll support
- ✅ RTL language support

---

## 📦 Installation

### Fresh Installation
1. Extract `news-filter-v6.0.3.zip`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extracted folder

### Upgrade from v4.9.0
1. Download `news-filter-v6.0.3.zip`
2. Extract to a folder
3. Go to `chrome://extensions/`
4. Remove News Filter v4.9.0
5. Click "Load unpacked" and select v6.0.3
6. Keywords are automatically preserved ✅

---

## 🌐 Browser Compatibility

- Chrome 88+
- Microsoft Edge 88+
- Opera 74+
- Brave Browser (latest)

---

## 🔍 Testing Verification

- ✅ Highlighting works on BBC (unchanged)
- ✅ Highlighting works on CNN (unchanged)
- ✅ Multiple articles now appear in drawer on BBC
- ✅ Multiple articles now appear in drawer on CNN
- ✅ Filter count shows correct number
- ✅ Each article displays with correct title and keyword
- ✅ Drawer scrolls properly with multiple articles
- ✅ Articles maintain correct order (top to bottom)
- ✅ RTL text displays correctly
- ✅ No performance degradation

---

## 📋 Files Modified

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.0.3 |
| content.js | Added article messaging to popup (lines 944-954) |
| popup.html | Version string updated |
| popup.js | Version string updated |

---

## 🔄 Backward Compatibility

✅ Fully backward compatible with v4.9.0  
✅ No breaking changes to storage format  
✅ Keywords and settings preserved  
✅ Existing articles in storage still work  

---

## 💡 Why This Approach

Rather than attempting large-scale refactoring (which introduced bugs), we took a **minimal, surgical approach**:

1. Reverted to proven v4.9.0 baseline
2. Identified the exact missing piece (article messaging)
3. Added only that missing piece
4. Preserved all working functionality

This ensures:
- Maximum stability
- Minimal risk of new bugs
- Clear, traceable changes
- Easy to understand and maintain

---

## 🔮 Future Improvements

- **v6.0.4**: Add timestamp sorting for articles (Today, Yesterday, etc.)
- **v6.1.0**: Add article preview on hover
- **v6.2.0**: Add article filtering by keyword in drawer
- **v7.0.0**: Add statistics dashboard

---

## 📞 Support

For issues or questions:
1. Check README.md for general documentation
2. Review troubleshooting sections
3. Check TECHNICAL_SUMMARY.md for technical details

---

**Version**: 6.0.3  
**Release Date**: January 3, 2026  
**Status**: Production Ready  
**Package Size**: ~50 KB

The drawer now displays all filtered articles correctly on BBC, CNN, and other news sites! 🎉
