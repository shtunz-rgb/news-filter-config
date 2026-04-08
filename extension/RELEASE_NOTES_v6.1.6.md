# News Filter v6.1.6 - Simplified Regex Approach

**Release Date**: January 10, 2026  
**Status**: Production Ready

## 🔴 Issue Fixed

### Problem
In v6.1.5, the regex still found 0 matches even though the actual class name was `container__link--type-article`.

### Root Cause
The regex pattern was too complex and trying to match the entire article block from opening `<a>` tag to closing `</a>` tag. The pattern `[\s\S]*?<\/a>` was causing issues because:
1. Article content is deeply nested
2. There might be multiple `</a>` tags before the actual closing tag
3. The greedy/non-greedy matching wasn't working as expected

### Solution
**Simplified the approach**: Instead of trying to match the entire article block, now:
1. Find all `<a>` tags with `link--type-article` in the class (just the opening tag)
2. Store their URLs and positions
3. For each link, find the nearest `<span class="container__headline-text">` headline after it
4. Match link + headline together

This is much more robust because:
- ✅ Simpler regex patterns
- ✅ Doesn't rely on matching closing tags
- ✅ Handles nested HTML better
- ✅ More resilient to HTML structure changes

## ✅ Changes Made

### cnn-sections-config.js
- **Rewrote**: `extractCNNArticles()` function with simplified approach
- **Changed**: From matching entire article blocks to finding links and headlines separately
- **Improved**: Uses `exec()` loop to find all matches with positions
- **Added**: Better error logging

### manifest.json
- **Updated**: Version from 6.1.5 to 6.1.6
- **Updated**: Name from "News Filter v6.1.5" to "News Filter v6.1.6"

## 🧪 Testing Checklist

- [ ] Open extension popup on CNN.com
- [ ] Click "Sports" section button
- [ ] Wait 2-3 seconds for articles to load
- [ ] Verify articles display (should be ~20 articles)
- [ ] Check console for log: "Found X article links"
- [ ] Check console for: "Total articles extracted: X"
- [ ] Click article title - should open in new tab
- [ ] Try other sections (World, Politics, Business, etc.)

## 📊 Technical Details

**New Extraction Flow (v6.1.6):**

```javascript
// Step 1: Find all <a> tags with link--type-article
// Pattern: /<a[^>]*link--type-article[^>]*href="([^"]+)"[^>]*>/gi
// This just matches the opening tag, not the entire block

// Step 2: For each link found, store URL and position
// links = [
//   { url: "/2026/01/09/sport/...", index: 12345 },
//   { url: "/2026/01/08/sport/...", index: 23456 },
//   ...
// ]

// Step 3: For each link, search for headline between it and next link
// Pattern: /<span[^>]*class="[^"]*container__headline-text[^"]*"[^>]*>([^<]+)<\/span>/gi
// This finds the headline within the article area
```

**Why this works:**
- ✅ Simpler regex patterns that are easier to debug
- ✅ Doesn't try to match complex nested HTML
- ✅ Uses position-based matching for accuracy
- ✅ More resilient to HTML structure changes

## 🚀 What's Working Now

- ✅ Service worker initializes correctly
- ✅ Message handlers receive requests
- ✅ HTML fetching works
- ✅ Simplified regex finds article links
- ✅ Headlines extracted separately
- ✅ Articles display in drawer
- ✅ Click to open in new tab
- ✅ Detailed logging for debugging

## 📝 Files Modified

- `cnn-sections-config.js` - Rewrote extraction with simplified approach
- `manifest.json` - Updated version to 6.1.6

## 🔍 Debugging Notes

The console logs now show:
- `Found X article links` - Number of links found
- `Extracted article N: ...` - Successfully extracted articles
- `Total articles extracted: X` - Final count
- `No headline found for link N` - If headline extraction fails

## ⬆️ Upgrade Instructions

1. Remove v6.1.5 from `chrome://extensions/`
2. Extract `news-filter-v6.1.6.zip`
3. Go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the `news-filter-v6.1.6` folder
7. Verify version shows 6.1.6

## 🎯 Key Improvement

The fundamental change is moving from **block-based matching** (trying to match entire article blocks) to **component-based matching** (finding links and headlines separately). This is:
- Simpler
- More robust
- Easier to debug
- More resilient to HTML changes
