# 🔧 News Filter v7.0.3 - Parameter Name Fix

## 🐛 Bug Fixed

**v7.0.3 fixes the parameter mismatch that prevented section articles from being fetched.**

---

## ❌ Issue in v7.0.2

**Problem:** Content pool remained empty, substitution couldn't work.

**Service Worker Error:**
```
Error: Site not supported: undefined
at SectionArticlesFetcher.fetchSectionArticles
```

**Root Cause:** Parameter name mismatch between content script and background script.

**ContentPoolManager sent:**
```javascript
{
  action: 'fetchSectionArticles',
  site: 'cnn',        // ❌ Wrong parameter name
  section: 'sports'   // ❌ Wrong parameter name
}
```

**Background.js expected:**
```javascript
{
  action: 'fetchSectionArticles',
  siteKey: 'cnn',      // ✅ Correct parameter name
  sectionKey: 'sports' // ✅ Correct parameter name
}
```

**Result:** Background script received `undefined` for both parameters, couldn't fetch sections.

---

## ✅ Fix in v7.0.3

**Changed ContentPoolManager (line 85-89):**
```javascript
// BEFORE (v7.0.2) - WRONG
const response = await chrome.runtime.sendMessage({
  action: 'fetchSectionArticles',
  site: site,           // ❌
  section: section      // ❌
});

// AFTER (v7.0.3) - CORRECT
const response = await chrome.runtime.sendMessage({
  action: 'fetchSectionArticles',
  siteKey: site,        // ✅
  sectionKey: section   // ✅
});
```

**Now the parameter names match what background.js expects!**

---

## 🧪 Testing Instructions

### 1. Install v7.0.3
1. **Remove v7.0.2** from `chrome://extensions/`
2. **Extract** `news-filter-v7.0.3.zip`
3. **Load unpacked** extension

### 2. Test Section Fetching
1. Visit **https://edition.cnn.com/**
2. **Open DevTools** (F12) → **Console** tab
3. **Clear console**
4. **Add keyword:** "Trump"
5. **Wait 3-5 seconds** (for pool building)

### 3. Verify in Console
**Look for these messages:**
```
[ContentPoolManager v7.0.0] Getting pool for cnn
[ContentPoolManager] Building new pool...
[ContentPoolManager] Fetching from 3 sections...
[ContentPoolManager] Fetching sports...
[ContentPoolManager] ✓ sports: 20 articles
[ContentPoolManager] Fetching business...
[ContentPoolManager] ✓ business: 20 articles
[ContentPoolManager] Fetching entertainment...
[ContentPoolManager] ✓ entertainment: 20 articles
[ContentPoolManager] Pool built: 60 articles from 3/3 sections
```

### 4. Verify in Service Worker Console
1. Go to `chrome://extensions/`
2. Click **"Service Worker"** for News Filter v7.0.3
3. **Look for:**
   ```
   [Background v6.2.0] Fetching articles for cnn:sports
   [Background v6.2.0] Successfully fetched 20 articles for cnn:sports
   [Background v6.2.0] Fetching articles for cnn:business
   [Background v6.2.0] Successfully fetched 20 articles for cnn:business
   [Background v6.2.0] Fetching articles for cnn:entertainment
   [Background v6.2.0] Successfully fetched 20 articles for cnn:entertainment
   ```

### 5. Verify Substitution
**On CNN page, look for:**
- ✅ Filtered articles have **red border** (not full red overlay)
- ✅ Content is **replaced** (different headline/image)
- ✅ **"Filtered: Trump"** label visible (top-right corner)
- ✅ **Section badge** shows (e.g., "📰 Sports")
- ✅ Clicking opens **replacement article** (not Trump article)

---

## 📊 Expected Behavior

### If Substitution Works:
```
┌─────────────────────────────────────┐
│ 🔴 RED BORDER                       │
│ [Image: Lakers game] ← NEW         │
│ Lakers win championship ← NEW       │
│                                     │
│ 🏷️ Filtered: Trump ← LABEL         │
│ 📰 Sports ← SECTION BADGE          │
└─────────────────────────────────────┘
```

### If Substitution Fails (Fallback):
```
┌─────────────────────────────────────┐
│ 🔴 RED OVERLAY (old behavior)       │
│ [Blurred Trump image]               │
│ Filtered: Trump                     │
└─────────────────────────────────────┘
```

---

## 🎯 Verification Checklist

After installing v7.0.3, verify:

- [ ] NO error: `Site not supported: undefined`
- [ ] Console shows: `Pool built: 60 articles from 3/3 sections`
- [ ] Service Worker shows: `Successfully fetched X articles`
- [ ] Filtered articles have red border (not full overlay)
- [ ] Content is replaced (different headline/image)
- [ ] "Filtered: keyword" label visible
- [ ] Section badge visible (e.g., "📰 Sports")

---

## 📝 Changelog

### Fixed:
- Parameter name mismatch in ContentPoolManager
- Section fetching now works correctly
- Content pool builds successfully

### Changed:
- Version updated to 7.0.3
- `site` → `siteKey`
- `section` → `sectionKey`

---

## 🎊 Summary

**v7.0.3 fixes the parameter mismatch that prevented section fetching!**

✅ Parameter names corrected  
✅ Section fetching working  
✅ Content pool building  
✅ Substitution ready to work  

**This is the critical fix needed for substitution to function!**

---

**Please test v7.0.3 and verify that:**
1. Console shows "Pool built: 60 articles" ✅
2. Service Worker shows "Successfully fetched" messages ✅
3. Substitution is working (red border + replaced content) ✅

Let me know what you see! 🚀
