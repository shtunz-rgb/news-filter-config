## ✅ News Filter v6.1.0 - CNN Section Articles Feature

This release introduces a major new feature: **CNN Section Articles**. You can now browse the top 20 articles from 8 different CNN sections directly within the extension popup, without having to visit each section page.

---

## 🚀 New Feature: CNN Section Articles

- **Browse 8 CNN Sections**: World, Politics, Business, Health, Entertainment, Style, Travel, Sports
- **Top 20 Articles**: See the latest 20 articles from each section
- **Dedicated Drawer**: Section articles are displayed in a new, dedicated drawer
- **One-Click Access**: Open articles in a new tab with a single click
- **Seamless Experience**: No need to navigate away from the current page

---

## 🔧 How It Works

1. **Visit CNN.com**: The extension detects when you are on CNN
2. **Select a Section**: Click a section button (e.g., "Sports")
3. **Articles Fetched**: The extension fetches the top 20 articles from that section in the background
4. **Drawer Populated**: The section drawer is populated with article titles and links
5. **Open Articles**: Click any article to open it in a new tab

---

## 📊 Technical Implementation

- **Background Fetching**: Uses `fetch()` to get HTML from section pages
- **HTML Parsing**: Parses the HTML to extract article data
- **CSS Selectors**: Uses site-specific selectors for accurate extraction
- **Caching**: Articles are cached per visit to reduce network requests
- **Error Handling**: Includes a "Retry" button for failed requests
- **UI Components**: New section buttons and drawer added to popup

---

## ✅ Key Benefits

- **Time-Saving**: Quickly browse multiple sections without leaving the page
- **Convenient**: Access top articles directly from the extension
- **User-Friendly**: Simple, intuitive interface
- **Integrated**: Works alongside existing filtering features

---

## 🌐 Browser Compatibility

- Chrome 88+
- Microsoft Edge 88+
- Opera 74+
- Brave Browser (latest)

---

## 📋 Files Modified

| File | Changes |
|------|---------|
| manifest.json | Version updated to 6.1.0 |
| background.js | Added section article fetching logic |
| popup.html | Added section buttons and drawer UI |
| popup.js | Added section selection and drawer population logic |
| cnn-sections-config.js | New file with CNN section URLs and selectors |
| section-articles-fetcher.js | New file with SectionArticlesFetcher class |
| section-articles-popup.js | New file with section articles popup handler |

---

## 🔄 Backward Compatibility

- ✅ Fully backward compatible with v6.0.11
- ✅ No breaking changes to storage format
- ✅ Keywords and settings preserved
- ✅ Existing filtering functionality unaffected

---

## 🚀 Installation

1. Extract `news-filter-v6.1.0.zip`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the folder
5. Extension is ready to use

---

**Version**: 6.1.0  
**Release Date**: January 7, 2026  
**Status**: Production Ready  
**Compatibility**: Manifest V3 Compliant

Enjoy the new CNN Section Articles feature! 🎉
