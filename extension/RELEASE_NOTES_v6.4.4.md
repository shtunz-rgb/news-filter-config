# News Filter v6.4.4 - Release Notes

## 🔤 HTML Entity Decoding - Clean Article Titles!

### Issue Fixed

#### Weird characters in article titles ✅
**Problem:** Article titles showed encoded entities instead of proper characters:
- `Miami&#x27;s top tackler` instead of `Miami's top tackler`
- `CEOs &amp; AI` instead of `CEOs & AI`
- `Trump&#39;s policy` instead of `Trump's policy`

**Root Cause:** HTML entities were not being decoded when extracting article titles from HTML.

**Solution:** Added **HTML entity decoder** to all 4 extractors (CNN, BBC, Ynet, Yahoo).

---

## 🔧 Technical Changes

### HTML Entity Decoder

Added to all extractors:
```javascript
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
    '&#x27;': "'", '&#x2F;': '/', '&#39;': "'", '&#34;': '"', '&nbsp;': ' ',
    '&ndash;': '–', '&mdash;': '—', '&lsquo;': ''', '&rsquo;': ''',
    '&ldquo;': '"', '&rdquo;': '"', '&hellip;': '…'
  };
  
  // Replace named entities
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Replace numeric entities (&#123; or &#xAB;)
  decoded = decoded.replace(/&#(\d+);/g, (m, d) => String.fromCharCode(d));
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
  
  return decoded;
};
```

### Updated Extractors

**All 4 extractors now decode HTML entities:**
- ✅ CNN Extractor - v6.4.4
- ✅ BBC Extractor - v6.4.4
- ✅ Ynet Extractor - v6.4.4
- ✅ Yahoo Extractor - v6.4.4

**Applied to all headline extractions:**
```javascript
// Before
const headline = linkMatch[2].trim();

// After
const headline = decodeHtmlEntities(linkMatch[2].trim());
```

---

## ✅ Supported HTML Entities

### Named Entities:
- `&amp;` → `&` (ampersand)
- `&lt;` → `<` (less than)
- `&gt;` → `>` (greater than)
- `&quot;` → `"` (quote)
- `&apos;` → `'` (apostrophe)
- `&nbsp;` → ` ` (non-breaking space)
- `&ndash;` → `–` (en dash)
- `&mdash;` → `—` (em dash)
- `&lsquo;` → `'` (left single quote)
- `&rsquo;` → `'` (right single quote)
- `&ldquo;` → `"` (left double quote)
- `&rdquo;` → `"` (right double quote)
- `&hellip;` → `…` (ellipsis)

### Numeric Entities:
- `&#39;` → `'` (decimal)
- `&#x27;` → `'` (hexadecimal)
- `&#34;` → `"` (decimal)
- `&#x2F;` → `/` (hexadecimal)
- Any `&#NNN;` or `&#xHH;` format

---

## 🧪 Testing Results

**Test Cases:**
```
✅ Miami&#x27;s top tackler → Miami's top tackler
✅ CEOs &amp; AI → CEOs & AI
✅ Trump&#39;s policy → Trump's policy
✅ &lt;Company&gt; merger → <Company> merger
✅ Market&hellip; → Market…
```

**All tests passed!** 🎉

---

## 🧪 How to Test

1. Remove v6.4.3 from Chrome
2. Load v6.4.4 unpacked
3. Visit any supported news site
4. Open extension popup
5. Click any section button
6. **Verify:**
   - ✅ Article titles display correctly
   - ✅ No `&#x27;` or `&amp;` in titles
   - ✅ Apostrophes show as `'` not `&#x27;`
   - ✅ Ampersands show as `&` not `&amp;`
   - ✅ Quotes show as `"` not `&quot;`

**Look for articles with:**
- Possessives (Miami's, Trump's)
- Ampersands (CEOs & AI)
- Quotes ("new policy")
- Special punctuation (…, –, —)

---

## 📊 All Sites Status - COMPLETE! 🎉

| Site | Sections | Extraction | HTML Decoding | Status |
|------|----------|------------|---------------|--------|
| **CNN** | 9 | Single pattern | ✅ **ADDED!** | ✅ Complete |
| **BBC** | 9 | Container-based | ✅ **ADDED!** | ✅ Complete |
| **Ynet** | 12 | Container + Hebrew | ✅ **ADDED!** | ✅ Complete |
| **Yahoo** | 5 | Triple-pattern | ✅ **ADDED!** | ✅ Complete |

**Total: 35 sections across 4 major news sites!** 🚀

---

## 🎉 All Features Working

### Original Features:
- ✅ Keyword filtering
- ✅ Keyword bank
- ✅ Enable/disable toggle
- ✅ Filtered article counter

### Multi-Site Section Articles:
- ✅ **CNN** (9 sections) - Single pattern + HTML decoding
- ✅ **BBC** (9 sections) - Container-based + HTML decoding
- ✅ **Ynet** (12 sections) - Hebrew support + HTML decoding
- ✅ **Yahoo** (5 sections) - Triple-pattern + HTML decoding

### Technical Excellence:
- ✅ Manifest V3
- ✅ Service worker architecture
- ✅ Container-based extraction
- ✅ Triple-pattern extraction (Yahoo)
- ✅ **HTML entity decoding (ALL sites)**
- ✅ No false headline-link pairings
- ✅ No duplicate articles
- ✅ Clean, readable article titles
- ✅ Hebrew (RTL) text support
- ✅ Multi-subdomain support
- ✅ Article caching (1 hour)
- ✅ Error handling & retry
- ✅ Fast loading (2-3 seconds)

---

## 🔍 Version History

### v6.4.4 (Current) - HTML Entity Decoding
- ✅ Added HTML entity decoder to all 4 extractors
- ✅ Supports 15+ named entities
- ✅ Supports numeric entities (decimal & hex)
- ✅ Clean, readable article titles across all sites

### v6.4.3 - Yahoo Finance Fixed
- ✅ Added Pattern 3 for finance.yahoo.com
- ✅ Triple-pattern extraction for Yahoo

### v6.4.2 - Yahoo Sports Fixed
- ✅ Added Pattern 2 for sports.yahoo.com
- ✅ Dual-pattern extraction for Yahoo

### v6.4.1 - Yahoo URLs Fixed
- ✅ Fixed Yahoo sections config
- ✅ Multi-subdomain support

### v6.4.0 - Yahoo Extractor Implemented
- ✅ Fixed Yahoo site detection
- ✅ Implemented Yahoo article extractor

### v6.3.0 - Ynet Complete
- ✅ Fixed Ynet sections config
- ✅ Rewrote Ynet extractor

### v6.2.9 - BBC Complete
- ✅ Fixed BBC headline-link pairing
- ✅ Eliminated BBC duplicate articles

---

## 🎯 Mission Accomplished!

**All 4 news sites are fully functional with clean article titles!**

No more weird characters like:
- ❌ `&#x27;` → ✅ `'`
- ❌ `&amp;` → ✅ `&`
- ❌ `&quot;` → ✅ `"`
- ❌ `&#39;` → ✅ `'`

**Perfect article title display across all sites!** 🎊

---

**Date:** January 24, 2026  
**Build:** Stable  
**Status:** Production Ready - All Sites Complete with Clean Titles! 🎉
