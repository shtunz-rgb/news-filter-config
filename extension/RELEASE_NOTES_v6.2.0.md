# News Filter v6.2.0 - Multi-Site Support

**Release Date**: January 10, 2026  
**Status**: Production Ready

## 🎯 Major Feature: Multi-Site Support

### What's New

News Filter now supports **multiple news websites** with the same simple interface! The same section buttons work across different news sites automatically.

**Supported Sites:**
- ✅ **CNN** - CNN.com
- ✅ **BBC** - BBC.com
- ⏳ **Yahoo News** - news.yahoo.com (framework ready, extractor pending)
- ⏳ **Ynet** - ynet.co.il (framework ready, extractor pending)

### How It Works

1. **Automatic Detection** - Extension detects which news site you're on
2. **Same Buttons** - Section buttons (Sports, Business, etc.) work on any supported site
3. **Site-Specific Content** - Articles are fetched from the current site
4. **Seamless Experience** - No extra clicks or configuration needed

### User Experience

**Before (v6.1.7):**
- Only worked on CNN
- Had to manually switch between sites

**After (v6.2.0):**
- Visit CNN.com → Click "Sports" → Get CNN sports articles
- Visit BBC.com → Click "Sports" → Get BBC sports articles
- Visit unsupported site → See "Unfortunately we don't support this site yet"

## 🏗️ Architecture

### New Modules

**site-detector.js** - Detects current news website
```javascript
SiteDetector.detectSite(hostname)  // Returns site config or null
SiteDetector.isSupported(hostname)  // Check if site is supported
```

**extractors/cnn-extractor.js** - CNN-specific extraction logic
- Uses date-based URL pattern: `/YYYY/MM/DD/section/slug`
- Extracts headlines from `<span class="container__headline-text">`

**extractors/bbc-extractor.js** - BBC-specific extraction logic
- Uses article ID pattern: `/section/subsection/articles/ID`
- Extracts headlines from `<span aria-hidden="false">`
- Handles duplicate URLs (removes anchors)

**bbc-sections-config.js** - BBC section definitions
```javascript
const BBC_SECTIONS = {
  sport: { name: 'Sport', url: 'https://www.bbc.com/sport' },
  business: { name: 'Business', url: 'https://www.bbc.com/business' },
  culture: { name: 'Culture', url: 'https://www.bbc.com/culture' },
  // ... more sections
}
```

### Updated Modules

**section-articles-fetcher.js** - Now routes to correct extractor
- Accepts `siteKey` parameter
- Routes to appropriate extractor (CNN, BBC, etc.)
- Caches results per site

**section-articles-popup.js** - Multi-site aware
- Detects current site on popup open
- Shows "not supported" message for unsupported sites
- Passes `siteKey` to background when fetching
- Updates drawer title with site name

**background.js** - Updated message handlers
- `fetchSectionArticles` now accepts `siteKey`
- `getSections` now accepts `siteKey`
- Routes to correct extractor

**manifest.json** - Added new scripts
```json
"scripts": [
  "site-detector.js",
  "extractors/cnn-extractor.js",
  "extractors/bbc-extractor.js",
  "cnn-sections-config.js",
  "bbc-sections-config.js",
  "section-articles-fetcher.js"
]
```

## 🚀 Testing

### Test CNN
1. Visit https://www.cnn.com/sport
2. Click extension popup
3. Click "Sports" button
4. Verify CNN sports articles load

### Test BBC
1. Visit https://www.bbc.com/sport
2. Click extension popup
3. Click "Sports" button
4. Verify BBC sports articles load

### Test Unsupported Site
1. Visit any non-supported news site
2. Click extension popup
3. Verify message: "Unfortunately we don't support this site yet"

## 📊 Technical Details

### Site Detection Flow
```
User visits website
  ↓
Popup opens
  ↓
detectCurrentSite() runs
  ↓
Checks hostname against known patterns
  ↓
Sets currentSite variable
  ↓
Shows appropriate UI (buttons or "not supported" message)
```

### Article Fetching Flow
```
User clicks section button
  ↓
selectSection() called with sectionKey
  ↓
Sends message to background with sectionKey + siteKey
  ↓
Background routes to correct extractor
  ↓
Extractor fetches HTML and extracts articles
  ↓
Results cached and returned to popup
  ↓
Articles displayed in drawer
```

### Adding New Sites

To add a new news site (e.g., Yahoo News):

1. **Create extractor** - `extractors/yahoo-extractor.js`
```javascript
const YahooExtractor = {
  extract(html, sectionKey) {
    // Implement extraction logic
    return articles;
  }
};
```

2. **Create section config** - `yahoo-sections-config.js`
```javascript
const YAHOO_SECTIONS = {
  sport: { name: 'Sport', url: 'https://news.yahoo.com/sport' },
  // ... more sections
};
```

3. **Update site-detector.js** - Add hostname pattern
```javascript
if (hostname.includes('yahoo.com') && hostname.includes('news')) {
  return { name: 'Yahoo News', key: 'yahoo', extractor: 'yahoo' };
}
```

4. **Update section-articles-fetcher.js** - Add extractor and config
```javascript
this.extractors.yahoo = YahooExtractor;
this.sectionConfigs.yahoo = YAHOO_SECTIONS;
```

5. **Update manifest.json** - Add new scripts
```json
"scripts": [
  "yahoo-sections-config.js",
  "extractors/yahoo-extractor.js"
]
```

## 🔄 Backward Compatibility

- ✅ All v6.1.7 features still work
- ✅ CNN extraction unchanged
- ✅ Cache format compatible
- ✅ No breaking changes

## 📝 Files Modified/Added

### New Files
- `site-detector.js` - Site detection module
- `extractors/cnn-extractor.js` - CNN extraction logic
- `extractors/bbc-extractor.js` - BBC extraction logic
- `bbc-sections-config.js` - BBC section definitions
- `RELEASE_NOTES_v6.2.0.md` - This file

### Modified Files
- `section-articles-fetcher.js` - Multi-site support
- `section-articles-popup.js` - Site detection and routing
- `background.js` - Updated message handlers
- `manifest.json` - Added new scripts

### Unchanged Files
- `cnn-sections-config.js` - Still used for CNN
- `content.js` - No changes needed
- `popup.html` - No changes needed
- All other files

## 🎯 Next Steps

1. **Test thoroughly** on CNN and BBC
2. **Add Yahoo News extractor** (framework ready)
3. **Add Ynet extractor** (framework ready)
4. **Add more sites** as needed

## 🐛 Known Limitations

- BBC extractor may miss some articles if headline structure varies significantly
- Yahoo News and Ynet extractors not yet implemented
- No support for paywalled content

## 💡 Future Improvements

- Add more news sites (Guardian, Reuters, AP News, etc.)
- Settings page to choose which sites to enable
- Customizable section names per site
- Article preview on hover
- Share articles feature
