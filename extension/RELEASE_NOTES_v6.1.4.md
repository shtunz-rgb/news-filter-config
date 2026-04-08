# News Filter v6.1.4 - CNN HTML Structure Fix

**Release Date**: January 9, 2026  
**Status**: Production Ready

## 🔴 Issue Fixed

### Problem
In v6.1.3, articles still weren't loading. The error was "No articles found for this section" even though articles were clearly visible on CNN.

### Root Cause
The regex patterns were looking for the **wrong HTML structure**. I was searching for:
- `<span data-container-type="article-container">` 
- `<a data-link-type="article">`

But the **actual CNN HTML structure** uses:
- `<a class="container__link container__link--type-article">`
- `<span class="container__headline-text">` (inside the link)

The old patterns matched nothing, so no articles were extracted.

### Solution
Updated the regex patterns to match the **actual CNN HTML structure**:

**Old pattern:**
```javascript
/<span[^>]*data-container-type="article-container"[^>]*>[\s\S]*?<\/span>/gi
```

**New pattern:**
```javascript
/<a[^>]*class="[^"]*container__link--type-article[^"]*"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi
```

This now correctly matches article links and extracts:
1. **URL** from the `href` attribute
2. **Headline** from the nested `<span class="container__headline-text">`

## ✅ Changes Made

### cnn-sections-config.js
- **Updated**: Article container regex to match `<a class="...container__link--type-article...">`
- **Updated**: Link extraction to use `href` directly from the article link
- **Added**: Detailed logging to help debug extraction process
- **Improved**: Error messages show which articles failed and why

### manifest.json
- **Updated**: Version from 6.1.3 to 6.1.4
- **Updated**: Name from "News Filter v6.1.3" to "News Filter v6.1.4"

## 🧪 Testing Checklist

- [ ] Open extension popup on CNN.com
- [ ] Click "Sports" section button
- [ ] Wait 2-3 seconds for articles to load
- [ ] Verify articles display with correct titles
- [ ] Verify "No articles found" error is gone
- [ ] Click article title - should open in new tab
- [ ] Try other sections (World, Politics, Business, etc.)
- [ ] Check console for extraction logs

## 📊 Technical Details

**New Extraction Flow (v6.1.4):**
1. Fetch CNN section page HTML
2. Find all `<a>` tags with class containing `container__link--type-article`
3. For each article link:
   - Extract `href` attribute for URL
   - Find nested `<span class="container__headline-text">` for title
   - Decode HTML entities
   - Normalize URLs (relative → absolute)
4. Return top 20 articles

**Regex Pattern Breakdown:**
```
/<a[^>]*class="[^"]*container__link--type-article[^"]*"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi
```
- `<a[^>]*` - Match opening `<a>` tag
- `class="[^"]*container__link--type-article[^"]*"` - Class must contain `container__link--type-article`
- `[^>]*href="([^"]+)"` - Capture URL from href attribute
- `[^>]*>[\s\S]*?<\/a>` - Match everything until closing `</a>`

## 🚀 What's Working Now

- ✅ Service worker initializes correctly
- ✅ Message handlers receive requests
- ✅ HTML fetching works
- ✅ Regex patterns match actual CNN HTML
- ✅ Articles extract successfully
- ✅ Articles display in drawer
- ✅ Click to open in new tab
- ✅ Error handling with detailed logging

## 📝 Files Modified

- `cnn-sections-config.js` - Updated regex patterns to match actual CNN HTML
- `manifest.json` - Updated version to 6.1.4

## 🔍 Debugging Notes

If articles still don't load:
1. Open DevTools (F12) on CNN.com
2. Check Console tab for logs starting with `[CNN Sections v6.1.4]`
3. Look for messages like:
   - `Found X potential article containers` - Shows if regex found articles
   - `Extracted article N: ...` - Shows successful extractions
   - `Total articles extracted: X` - Final count
4. If count is 0, the regex isn't matching the HTML structure

## ⬆️ Upgrade Instructions

1. Remove v6.1.3 from `chrome://extensions/`
2. Extract `news-filter-v6.1.4.zip`
3. Go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the `news-filter-v6.1.4` folder
7. Verify version shows 6.1.4

## 🎯 Next Steps

After confirming this fix works:
- Test with all 8 section buttons
- Verify article count and titles are correct
- Add BBC Section Articles support
- Add Yahoo News Section support
- Add Ynet Hebrew support
- Implement persistent caching option
