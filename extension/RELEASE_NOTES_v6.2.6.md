# News Filter v6.2.6 - BBC Extractor Method Name Fix

**Release Date**: January 18, 2026  
**Status**: Production Ready

## 🐛 Issue Fixed

### BBC Blank Results ✅
- **Problem**: BBC was returning blank results despite finding 39 article links
- **Root Cause**: Method name mismatch - fetcher was calling `extract()` but BBC extractor had `extractArticles()`
- **Solution**: Renamed `extractArticles()` to `extract()` to match the expected interface
- **Result**: BBC articles now load successfully!

---

## 🔍 Technical Details

**The Bug:**
```javascript
// section-articles-fetcher.js calls:
const articles = extractor.extract(html, sectionKey);

// But BBC extractor had:
extractArticles(html, limit = 20) { ... }

// Result: TypeError - extract is not a function
```

**The Fix:**
```javascript
// BBC extractor now has:
extract(html, sectionKey) {
  const limit = 20;
  // ... extraction logic
}
```

---

## ✅ What's Working

| Site | Filtering | Section Articles | Status |
|------|-----------|------------------|--------|
| CNN | ✅ | ✅ | Fully working |
| BBC | ✅ | ✅ | **FIXED** - Now working! |
| Ynet | ✅ | ✅ | Fully working |
| Yahoo | ✅ | ⏳ | Filtering works, extractor pending |
| Others | ✅ | ❌ | Filtering works |

---

## 🧪 How to Test

### Test BBC Section Articles
1. Extract `news-filter-v6.2.6.zip`
2. Remove v6.2.5 from `chrome://extensions/`
3. Load unpacked the v6.2.6 folder
4. Visit https://www.bbc.com/sport
5. Click extension popup
6. Click "Sport" button
7. **BBC articles should load** ✅
8. Check console for `[BBCExtractor v6.2.6]` logs ✅

### Verify Other Sites Still Work
1. Test CNN → Should still work ✅
2. Test Ynet → Should still work ✅
3. Test filtering → Should still work ✅

---

## 📦 Package Contents

**Size**: ~14 MB  
**Status**: Production Ready

**Modified Files:**
- `extractors/bbc-extractor.js` - Renamed method to `extract()`
- `manifest.json` - Updated to v6.2.6

**All Other Files:**
- Unchanged from v6.2.5

---

## 🎯 Expected Console Output

When clicking a BBC section button, you should see:
```
[Fetcher v6.2.5] Fetching bbc sport
[BBCExtractor v6.2.6] Extracting BBC articles...
[BBCExtractor v6.2.6] Found 39 article links
[BBCExtractor v6.2.6] Extracted article 1: Tariffs don't serve anyone...
[BBCExtractor v6.2.6] Extracted article 2: ...
...
[BBCExtractor v6.2.6] Total articles extracted: 20
```

---

## 🔄 Backward Compatibility

- All v6.2.5 features intact
- All filtering features working
- CNN and Ynet still working
- No breaking changes

---

## 📝 Known Issues

- Yahoo extractor not yet implemented (framework ready)
- Yahoo sections buttons visible but non-functional

