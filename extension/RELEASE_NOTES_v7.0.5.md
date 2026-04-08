# 🎯 News Filter v7.0.5 - Flickering Fixed!

## 🐛 Three Critical Bugs Fixed

**v7.0.5 fixes the text flickering issue with three targeted fixes:**

1. **Fix #1:** Class marker prevents re-substitution
2. **Fix #2:** Headline truncation preserves layout
3. **Fix #3:** Pool reuse disabled to prevent flickering

---

## ❌ Issues in v7.0.4

### Issue #1: Infinite Re-Substitution Loop
**Problem:** MutationObserver detected DOM changes from substitution → re-processed the same articles → endless loop

**Console showed:**
```
[NewsFilter] Attempting substitution for keyword: Trump (repeated 100+ times)
```

### Issue #2: Layout Shifts
**Problem:** Replacement headlines had different lengths → container size changed → layout jumped around

### Issue #3: Text Flickering
**Problem:** When pool exhausted, articles were reused → different matches selected → text kept changing

**Console showed:**
```
[ArticleMatcher] Pool exhausted! Allowing reuse.
```

---

## ✅ Fixes in v7.0.5

### Fix #1: Class Marker Prevents Re-Substitution

**Files:** `content.js` (line 1731-1735) + `substitution-strategies.js` (line 58)

**How it works:**
1. After substitution, add `skeep-substituted` class to element
2. Before substitution, check if element has this class
3. If yes, skip it → **no re-processing!**

**Code:**
```javascript
// In content.js trySubstitution()
if (element.classList.contains('skeep-substituted')) {
  console.log(`[NewsFilter] Skipping already substituted article`);
  return null;
}

// In substitution-strategies.js substitute()
element.classList.add('skeep-substituted');
```

---

### Fix #2: Headline Truncation Preserves Layout

**File:** `substitution/substitution-strategies.js` (line 36-47)

**How it works:**
1. Get original headline length before replacement
2. If replacement is longer, truncate to original length
3. Add "..." at the end to indicate truncation

**Code:**
```javascript
const originalLength = headline.textContent.trim().length;
let newText = replacement.title;

// Truncate if replacement is longer
if (newText.length > originalLength && originalLength > 10) {
  newText = newText.substring(0, originalLength - 3) + '...';
  console.log(`[CNN] Truncating headline to ${originalLength} chars`);
}

headline.textContent = newText;
```

**Result:** Container size stays consistent → no layout shifts!

---

### Fix #3: Pool Reuse Disabled

**File:** `substitution/article-matcher.js` (line 30-34)

**How it works:**
1. When pool is exhausted, return `null` instead of clearing used list
2. Substitution falls back to overlay mode for remaining articles
3. No flickering because same article is never used twice

**Code:**
```javascript
// BEFORE (v7.0.4) - caused flickering
if (availablePool.length === 0) {
  this.usedReplacements.clear();  // ❌ Allowed reuse
  availablePool.push(...contentPool);
}

// AFTER (v7.0.5) - prevents flickering
if (availablePool.length === 0) {
  console.warn(`[ArticleMatcher] Pool exhausted! No more replacements available.`);
  return null;  // ✅ Falls back to overlay
}
```

---

## 🔧 Additional Change: Image Replacement Disabled

**For now, image replacement is commented out** to focus on text-only substitution first.

This simplifies debugging and ensures text substitution works perfectly before adding image complexity.

---

## 🧪 Testing Instructions

### 1. Install v7.0.5
1. **Remove v7.0.4** from `chrome://extensions/`
2. **Extract** `news-filter-v7.0.5.zip`
3. **Load unpacked** extension

### 2. Test on CNN
1. Visit **https://edition.cnn.com/**
2. **Open Console** (F12)
3. **Clear console**
4. **Add keyword:** "Trump"
5. **Wait 5-10 seconds**

### 3. Verify Fixes

**Fix #1 - No Re-Substitution:**
```
✅ "Attempting substitution" appears only ONCE per article
✅ "Skipping already substituted article" appears for re-detected articles
❌ Should NOT see repeated "Attempting substitution" for same article
```

**Fix #2 - No Layout Shifts:**
```
✅ Container sizes stay consistent
✅ Headlines may end with "..." if truncated
✅ Console shows "Truncating headline to X chars" when truncating
```

**Fix #3 - No Flickering:**
```
✅ Text stays stable after initial substitution
✅ "Pool exhausted! No more replacements available." appears when pool empty
❌ Should NOT see "Pool exhausted! Allowing reuse."
```

### 4. Expected Console Output

**Good (v7.0.5):**
```
[NewsFilter v7.0.0] Attempting substitution for keyword: Trump
[CNN] Truncating headline to 45 chars
[CNN] Replacing headline: "Trump..." → "Lakers win..."
[CNN] ✓ Substitution complete
[NewsFilter] ✓ Substitution successful
[NewsFilter] Skipping already substituted article
[NewsFilter] Skipping already substituted article
[ArticleMatcher] Pool exhausted! No more replacements available.
```

**Bad (v7.0.4):**
```
[NewsFilter v7.0.0] Attempting substitution for keyword: Trump (repeated 100+ times)
[ArticleMatcher] Pool exhausted! Allowing reuse.
```

---

## 📊 Expected Behavior

### ✅ Seamless Substitution (v7.0.5)

**When substitution works:**
- Red border (not full overlay)
- Headline replaced (may be truncated with "...")
- **Text stays stable** (no flickering!)
- **Layout stays consistent** (no jumping!)
- Section badge visible

### ⚠️ Fallback to Overlay

**When pool exhausted:**
- Remaining filtered articles get red overlay (old behavior)
- This is expected and correct behavior

---

## 🎯 Verification Checklist

After installing v7.0.5, verify:

- [ ] "Attempting substitution" appears **once per article** (not repeating)
- [ ] "Skipping already substituted article" appears for re-detected articles
- [ ] Text **stays stable** after initial substitution (no flickering!)
- [ ] Container sizes **stay consistent** (no layout shifts!)
- [ ] Headlines may end with "..." if truncated
- [ ] "Pool exhausted! No more replacements available." when pool empty
- [ ] NO "Pool exhausted! Allowing reuse." message

---

## 📝 Changelog

### v7.0.5 (Current)

**Fixed:**
- Infinite re-substitution loop (class marker)
- Layout shifts (headline truncation)
- Text flickering (pool reuse disabled)

**Changed:**
- Version updated to 7.0.5
- Image replacement temporarily disabled (focus on text-only)
- `content.js`: Added class check before substitution
- `substitution-strategies.js`: Added class marker + headline truncation
- `article-matcher.js`: Return null when pool exhausted

---

## 🎊 Summary

**v7.0.5 stops the flickering!**

✅ Class marker prevents re-substitution  
✅ Headline truncation preserves layout  
✅ Pool reuse disabled prevents flickering  
✅ Text stays stable after substitution  

**This version should provide a stable, flicker-free substitution experience!** 🚀

---

**Please test v7.0.5 and confirm:**
1. Text stays stable (no flickering)?
2. Layout stays consistent (no jumping)?
3. "Skipping already substituted article" appears?

Let me know! 🎉
