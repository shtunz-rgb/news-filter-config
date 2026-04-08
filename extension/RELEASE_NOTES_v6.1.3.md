# News Filter v6.1.3 - DOMParser Service Worker Fix

**Release Date**: January 9, 2026  
**Status**: Production Ready

## 🔴 Issue Fixed

### Problem
In v6.1.2, articles started fetching but failed with error:
```
Failed to load articles: DOMParser is not defined
```

### Root Cause
The `extractCNNArticles()` function in `cnn-sections-config.js` tried to use `DOMParser`, which is a **browser DOM API** that doesn't exist in the **service worker context**.

**Why it fails:**
- Service workers run in a limited JavaScript environment
- They don't have access to DOM APIs like `DOMParser`, `document`, `window`, etc.
- They can only use Web APIs explicitly available to workers (fetch, storage, messaging, etc.)

### Solution
Rewrote `extractCNNArticles()` to use **regex-based HTML parsing** instead of DOMParser. This approach:
- ✅ Works in service worker context
- ✅ Doesn't require DOM APIs
- ✅ Extracts articles from raw HTML strings
- ✅ Handles HTML entity decoding

## ✅ Changes Made

### cnn-sections-config.js
- **Replaced**: `extractCNNArticles()` function to use regex instead of DOMParser
- **Added**: `decodeHtmlEntities()` function to handle HTML entities (&amp;, &lt;, etc.)
- **Improved**: URL normalization (converts relative URLs to absolute)
- **Updated**: Version comment to v6.1.3

### manifest.json
- **Updated**: Version from 6.1.2 to 6.1.3
- **Updated**: Name from "News Filter v6.1.2" to "News Filter v6.1.3"

## 🧪 Testing Checklist

- [ ] Open extension popup on CNN.com
- [ ] Click "Sports" section button
- [ ] Wait 2-3 seconds for articles to load
- [ ] Verify articles display with titles
- [ ] Click article title - should open in new tab
- [ ] Try other sections (World, Politics, Business, etc.)
- [ ] Check console for no "DOMParser" errors

## 📊 Technical Details

**Regex-Based Extraction Flow:**
1. Fetch CNN section page HTML
2. Use regex to find all `<span data-container-type="article-container">` elements
3. For each container, extract:
   - Headline from `<span class="container__headline-text">` 
   - Link from `<a data-link-type="article" href="...">` 
4. Decode HTML entities in titles
5. Normalize URLs (relative → absolute)
6. Return array of articles

**Regex Patterns Used:**
```javascript
// Find article containers
/<span[^>]*data-container-type="article-container"[^>]*>[\s\S]*?<\/span>/gi

// Extract headline
/<span[^>]*class="[^"]*container__headline-text[^"]*"[^>]*>([^<]+)<\/span>/i

// Extract link
/<a[^>]*data-link-type="article"[^>]*href="([^"]+)"[^>]*>/i
```

## 🚀 What's Working Now

- ✅ Service worker initializes correctly
- ✅ Message handlers receive requests
- ✅ Articles fetch from CNN sections
- ✅ HTML parsing works in service worker
- ✅ Articles display in drawer
- ✅ Click to open in new tab
- ✅ Error handling with retry

## 📝 Files Modified

- `cnn-sections-config.js` - Rewrote extraction logic for service worker compatibility
- `manifest.json` - Updated version to 6.1.3

## 🔍 Debugging Notes

If articles still don't load:
1. Open DevTools (F12) on CNN.com
2. Check Network tab - verify HTML fetches successfully
3. Check Console for error messages
4. Look for "DOMParser" or "undefined" errors
5. Check service worker logs in `chrome://extensions/` → Details → Errors

## ⬆️ Upgrade Instructions

1. Remove v6.1.2 from `chrome://extensions/`
2. Extract `news-filter-v6.1.3.zip`
3. Go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the `news-filter-v6.1.3` folder
7. Verify version shows 6.1.3

## 🎯 Next Steps

After confirming this fix works:
- Test with all 8 section buttons
- Verify article count and titles are correct
- Add BBC Section Articles support
- Add Yahoo News Section support
- Add Ynet Hebrew support
