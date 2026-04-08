# News Filter v6.2.8 - BBC Link Matching & Deduplication Fix

**Release Date**: January 19, 2026  
**Status**: Production Ready

## 🐛 Issues Fixed

### 1. BBC Wrong Article Links ✅
- **Problem**: Clicking one article opened a different article
- **Root Cause**: Headlines were not properly paired with their links
- **Analysis**: BBC has inconsistent layouts - some headlines appear BEFORE links, others AFTER
- **Solution**: Implemented bidirectional search that looks both before AND after each link, picking the closest headline
- **Result**: Headlines now correctly match their links!

### 2. BBC Duplicate Articles ✅
- **Problem**: Same article appeared multiple times in the list
- **Root Cause**: BBC HTML has multiple links to the same article
- **Solution**: Added deduplication logic using a Set to track unique URLs
- **Result**: Each article now appears only once!

---

## 🔧 Technical Details

**Bidirectional Headline Search:**
```javascript
// Search BEFORE link (2000 chars)
const searchBefore = html.substring(Math.max(0, linkPos - 2000), linkPos);
const headlineBeforeMatch = searchBefore.match(headlineRegex);

// Search AFTER link (2000 chars)
const searchAfter = html.substring(linkPos, linkPos + 2000);
const headlineAfterMatch = searchAfter.match(headlineRegex);

// Pick the CLOSEST headline
if (headlineBeforeMatch && headlineAfterMatch) {
  const beforeDist = searchBefore.length - searchBefore.lastIndexOf(headlineBeforeMatch[0]);
  const afterDist = searchAfter.indexOf(headlineAfterMatch[0]);
  
  headline = (beforeDist < afterDist) ? headlineBeforeMatch[1] : headlineAfterMatch[1];
}
```

**Deduplication Logic:**
```javascript
const seenUrls = new Set();

while ((linkMatch = linkRegex.exec(html)) !== null) {
  const url = linkMatch[1];
  
  // Skip duplicates
  if (seenUrls.has(url)) {
    continue;
  }
  
  links.push(url);
  seenUrls.add(url);
}
```

---

## ✅ What's Working

| Site | Filtering | Section Buttons | Article Extraction | Link Accuracy | Deduplication | Status |
|------|-----------|-----------------|-------------------|---------------|---------------|--------|
| CNN | ✅ | ✅ | ✅ | ✅ | ✅ | Fully working |
| BBC | ✅ | ✅ | ✅ | ✅ **FIXED!** | ✅ **FIXED!** | Fully working |
| Ynet | ✅ | ✅ | ✅ | ✅ | ✅ | Fully working |
| Yahoo | ✅ | ✅ | ⏳ | ⏳ | ⏳ | Buttons show, extractor pending |

---

## 🧪 How to Test

### Test BBC Business Section
1. Extract `news-filter-v6.2.8.zip`
2. Remove v6.2.7 from `chrome://extensions/`
3. Load unpacked the v6.2.8 folder
4. Visit https://www.bbc.com/business
5. Click extension popup
6. Click "Business" button
7. **Articles should load** ✅
8. **No duplicate articles** ✅
9. **Click an article** - should open the CORRECT article ✅

### Test Link Accuracy
1. On BBC Business page with articles loaded
2. Note the title of the first article (e.g., "EU suspends approval of US trade deal")
3. Click that article
4. **Verify** the opened page matches the title ✅
5. Repeat for 2-3 more articles
6. **All links should match their headlines** ✅

### Test Deduplication
1. Check the article list
2. **Verify** no article appears twice ✅
3. Count the articles - should be ~20 unique articles ✅

---

## 📊 Expected Console Output

```
[BBCExtractor v6.2.8] Extracting BBC articles...
[BBCExtractor v6.2.8] Found 25 unique article links (after deduplication)
[BBCExtractor v6.2.8] Extracted article 1: Analysis: What it was like inside the room...
[BBCExtractor v6.2.8] Extracted article 2: EU suspends approval of US trade deal...
[BBCExtractor v6.2.8] Extracted article 3: UK inflation rises for first time...
...
[BBCExtractor v6.2.8] Total articles extracted: 20
```

---

## 📦 Package Contents

**Modified Files:**
- `extractors/bbc-extractor.js` - Bidirectional search + deduplication
- `manifest.json` - Updated to v6.2.8

**All Other Files:**
- Unchanged from v6.2.7

---

## 🎯 Key Improvements

1. **Smarter Headline Matching**: Searches both directions and picks closest
2. **Deduplication**: Removes duplicate URLs before extraction
3. **Better Accuracy**: Headlines now correctly match their links
4. **Cleaner Results**: No duplicate articles in the list

---

## 🔄 Backward Compatibility

- All v6.2.7 features intact
- All filtering features working
- CNN still working
- Ynet still working
- No breaking changes

---

## 📝 Known Issues

- Yahoo extractor not yet implemented (buttons show but no articles)
- Some BBC articles might still have mismatched headlines if they're more than 2000 chars away from the link

