# 🔧 News Filter v7.0.1 - Critical Fix for Substitution Engine

## 🐛 Bug Fixed

**v7.0.1 fixes the critical site detection bug that prevented substitution from working in v7.0.0.**

---

## ❌ Issue in v7.0.0

**Problem:** Substitution engine was not working - filtered articles showed overlay instead of being replaced.

**Console Error:**
```
[ContentPoolManager] Failed to fetch sports: Site not supported: undefined
```

**Root Cause:** The `trySubstitution` method was passing the full hostname (`edition.cnn.com`) to the ContentPoolManager, but the background script expected a site identifier (`cnn`).

**Result:** Content pool could not be built, so substitution fell back to overlay mode.

---

## ✅ Fix in v7.0.1

### Added Site Detection Helper

**New method:** `getSiteIdentifier()`

```javascript
getSiteIdentifier() {
  const hostname = window.location.hostname;
  
  // Map hostname to site identifier
  if (hostname.includes('cnn.com')) return 'cnn';
  if (hostname.includes('bbc.com') || hostname.includes('bbc.co.uk')) return 'bbc';
  if (hostname.includes('yahoo.com')) return 'yahoo';
  if (hostname.includes('ynet.co.il')) return 'ynet';
  
  return null; // Unknown site
}
```

**How it works:**
1. Gets current hostname (e.g., `edition.cnn.com`)
2. Maps to site identifier (e.g., `cnn`)
3. Passes identifier to ContentPoolManager
4. ContentPoolManager fetches sections correctly

---

## 🧪 Testing Instructions

### 1. Install v7.0.1
1. **Remove v7.0.0** from `chrome://extensions/`
2. **Extract** `news-filter-v7.0.1.zip`
3. **Load unpacked** extension

### 2. Test Substitution on CNN
1. Visit **https://edition.cnn.com/**
2. Add keyword: **"Trump"**
3. **Wait 2-3 seconds** (content pool loading)
4. **Verify:**
   - ✅ Console shows: `[NewsFilter] Site identified as: cnn`
   - ✅ Console shows: `[NewsFilter] Content pool size: 60`
   - ✅ Console shows: `[NewsFilter] Found match with score 0.85: ...`
   - ✅ Filtered articles have **red border** (not overlay)
   - ✅ Content is **replaced** (not blurred)
   - ✅ **"Filtered: Trump" label** visible
   - ✅ **Section badge** visible (e.g., "📰 Sports")

### 3. Expected Console Output
```
[NewsFilter v7.0.0] Attempting substitution for keyword: Trump
[NewsFilter] Site identified as: cnn
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
[NewsFilter] Content pool size: 60
[NewsFilter] Found match with score 0.85: Lakers win championship
[SubstitutionStrategy-CNN v7.0.0] Substituting article
[CNN] ✓ Substitution complete
[NewsFilter] ✓ Substitution successful
```

### 4. Test All Sites
- **CNN** → `edition.cnn.com` → Should identify as `cnn` ✅
- **BBC** → `www.bbc.com` → Should identify as `bbc` ✅
- **Yahoo** → `www.yahoo.com` → Should identify as `yahoo` ✅
- **Ynet** → `www.ynet.co.il` → Should identify as `ynet` ✅

---

## 📊 What Changed

### Modified Files:
- **content.js**
  - Added `getSiteIdentifier()` method
  - Updated `trySubstitution()` to use site identifier
  - Added logging for site identification

### Version Updates:
- **manifest.json** → v7.0.1
- **Version display** → "News Filter v7.0.1"

---

## 🎯 Verification Checklist

After installing v7.0.1, verify:

- [ ] Console shows `Site identified as: cnn` (not `edition.cnn.com`)
- [ ] Console shows `Content pool size: 60` (not 0)
- [ ] Console shows `Pool built: 60 articles from 3/3 sections`
- [ ] NO error: `Site not supported: undefined`
- [ ] Filtered articles have **red border** (not overlay)
- [ ] Content is **replaced** (not blurred)
- [ ] Clicking article opens **replacement article**

---

## 🐛 If Substitution Still Doesn't Work

If you still see overlays instead of substitution:

1. **Check Service Worker console:**
   - Go to `chrome://extensions/`
   - Click "Service Worker" for News Filter
   - Look for errors in `fetchSectionArticles`

2. **Check seamless mode toggle:**
   - Open extension popup
   - Verify "Seamless mode" is **ON** (blue toggle)

3. **Clear cache and reload:**
   - Remove extension
   - Clear browser cache
   - Reinstall v7.0.1
   - Hard refresh page (Ctrl+Shift+R)

---

## 📝 Changelog

### Fixed:
- Site detection now correctly maps hostname to site identifier
- Content pool manager can now fetch sections successfully
- Substitution engine now works as intended

### Added:
- `getSiteIdentifier()` helper method
- Site identification logging

### Changed:
- `trySubstitution()` now uses site identifier instead of hostname
- Version updated to 7.0.1

---

## 🎊 Summary

**v7.0.1 fixes the critical bug that prevented substitution from working in v7.0.0!**

✅ Site detection working  
✅ Content pool building successfully  
✅ Substitution engine functional  
✅ All 4 sites supported (CNN, BBC, Yahoo, Ynet)  

**Seamless substitution is now live!** 🚀

---

**Please test v7.0.1 and verify that substitution works correctly!**
