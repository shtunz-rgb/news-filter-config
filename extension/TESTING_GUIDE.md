# Testing Guide for News Filter v2.3

## Pre-Testing Checklist

- [ ] Extension loads without errors
- [ ] All modules are present
- [ ] manifest.json is valid
- [ ] No console errors on startup

## Unit Testing

### Module: SelectorEngine

**Test: Selector Compilation**
```javascript
// Should compile selectors without errors
const config = { articleSelectors: ['.article', 'article'], headlineSelectors: ['h1', 'h2'] };
const engine = new SelectorEngine(config);
console.assert(engine.getCompiledSelectors() === '.article, article');
```

**Test: Site Configuration**
```javascript
// Should load correct config for domain
const config = getSiteConfig('yahoo.com');
console.assert(config.domain === 'yahoo.com');
console.assert(config.articleSelectors.length > 0);
```

### Module: FilterCore

**Test: Keyword Matching**
```javascript
const filter = new FilterCore(['Trump', 'Biden']);
const element = document.createElement('div');
element.textContent = 'Trump announces new policy';
const result = filter.shouldFilter(element);
console.assert(result === 'Trump');
```

**Test: Non-ASCII Keywords**
```javascript
const filter = new FilterCore(['中国', 'Россия']);
const element = document.createElement('div');
element.textContent = '中国 news today';
const result = filter.shouldFilter(element);
console.assert(result === '中国');
```

### Module: ArticleDetector

**Test: Article Detection**
```javascript
const config = getSiteConfig('yahoo.com');
const engine = new SelectorEngine(config);
const detector = new ArticleDetector(engine);
const articles = detector.findArticles(document);
console.assert(articles.length > 0, 'Should find articles');
```

### Module: DOMManipulator

**Test: Overlay Application**
```javascript
const manipulator = new DOMManipulator();
const element = document.createElement('div');
const result = manipulator.applyOverlay(element, 'Trump');
console.assert(result === true);
console.assert(element.hasAttribute('data-news-filtered'));
```

## Integration Testing

### Test Site 1: Yahoo News

**URL:** https://news.yahoo.com

**Test Steps:**
1. Open the site
2. Add keyword "Trump" to filter
3. Verify articles with "Trump" are marked with red overlay
4. Scroll down to test infinite scroll
5. Verify new articles are filtered as they load

**Expected Results:**
- [ ] Articles detected correctly
- [ ] Red overlays appear on filtered articles
- [ ] Infinite scroll filtering works
- [ ] No console errors

**Performance Metrics:**
- Initial scan time: < 500ms
- Per-mutation processing: < 100ms
- Memory usage: < 20MB

### Test Site 2: BBC News

**URL:** https://www.bbc.com/news

**Test Steps:**
1. Open the site
2. Add keyword "Politics" to filter
3. Verify articles are detected
4. Check that overlays are applied correctly
5. Test with multiple keywords

**Expected Results:**
- [ ] Articles detected correctly
- [ ] Filtering works as expected
- [ ] No layout issues
- [ ] No console errors

### Test Site 3: CNN

**URL:** https://www.cnn.com

**Test Steps:**
1. Open the site
2. Add multiple keywords ("Trump", "Biden", "Sports")
3. Verify articles are filtered correctly
4. Check popup shows correct count
5. Disable and re-enable filtering

**Expected Results:**
- [ ] Multiple keyword filtering works
- [ ] Popup count is accurate
- [ ] Toggle on/off works correctly
- [ ] No console errors

### Test Site 4: The Guardian

**URL:** https://www.theguardian.com/international

**Test Steps:**
1. Open the site
2. Add keyword "Climate"
3. Verify DCR card detection
4. Check overlay appearance
5. Test with case-insensitive matching

**Expected Results:**
- [ ] Articles detected correctly
- [ ] Overlays appear properly
- [ ] Case-insensitive matching works
- [ ] No console errors

## Edge Case Testing

### Test: Empty Keywords

**Steps:**
1. Don't add any keywords
2. Open a news site
3. Verify no articles are filtered

**Expected Result:**
- [ ] No overlays appear
- [ ] No console errors

### Test: Very Long Keywords

**Steps:**
1. Add a very long keyword (> 100 characters)
2. Verify it's stored correctly
3. Verify matching works

**Expected Result:**
- [ ] Long keywords are handled correctly
- [ ] No performance degradation

### Test: Special Characters

**Steps:**
1. Add keywords with special characters ("@", "#", "$", etc.)
2. Verify matching works correctly

**Expected Result:**
- [ ] Special characters are handled
- [ ] Matching works as expected

### Test: Rapid Scrolling

**Steps:**
1. Open Yahoo News
2. Scroll rapidly
3. Verify articles are filtered correctly

**Expected Result:**
- [ ] All articles are filtered
- [ ] No articles are missed
- [ ] No console errors
- [ ] Browser doesn't freeze

### Test: Tab Switching

**Steps:**
1. Open multiple tabs with news sites
2. Switch between tabs
3. Verify filtering works on each tab

**Expected Result:**
- [ ] Filtering works independently on each tab
- [ ] No cross-tab interference

## Performance Testing

### Memory Usage

**Steps:**
1. Open DevTools (F12)
2. Go to Memory tab
3. Take heap snapshot
4. Open a news site
5. Add keywords and filter articles
6. Take another heap snapshot
7. Compare memory usage

**Expected Result:**
- [ ] Memory usage < 20MB
- [ ] No memory leaks
- [ ] Garbage collection works properly

### CPU Usage

**Steps:**
1. Open DevTools (F12)
2. Go to Performance tab
3. Record while scrolling on Yahoo News
4. Check CPU usage

**Expected Result:**
- [ ] CPU usage < 10% during normal scrolling
- [ ] No excessive DOM operations
- [ ] Smooth 60 FPS performance

### Selector Matching Speed

**Steps:**
1. Enable debug mode
2. Open a news site
3. Check console for timing information
4. Verify selector matching is fast

**Expected Result:**
- [ ] Selector compilation: < 50ms
- [ ] Article detection: < 100ms
- [ ] Keyword matching: < 200ms

## Browser Compatibility

- [ ] Chrome 90+
- [ ] Edge 90+
- [ ] Brave
- [ ] Vivaldi

## Accessibility Testing

- [ ] Overlays don't interfere with keyboard navigation
- [ ] Overlays have sufficient color contrast
- [ ] Extension works with screen readers

## Security Testing

- [ ] No XSS vulnerabilities
- [ ] No data leaks to external servers
- [ ] Storage is encrypted
- [ ] No sensitive data in logs

## Regression Testing

### Test: Previous Version Functionality

**Steps:**
1. Verify all features from v3.0.12 still work:
   - [ ] Keyword filtering
   - [ ] Infinite scroll support
   - [ ] Drawer functionality
   - [ ] Storage persistence
   - [ ] Popup UI

## Debugging

### Enable Debug Logging

1. Open `content/modules/config/defaults.js`
2. Change `DEBUG: false` to `DEBUG: true`
3. Reload extension
4. Open DevTools (F12)
5. Check console for detailed logs

### Common Issues

**Issue: Articles not being detected**
- Check console for errors
- Verify site is in siteStrategies.js
- Check selectors are correct
- Try adding more selectors

**Issue: Performance degradation**
- Check for memory leaks
- Verify MutationObserver is working
- Check CPU usage in DevTools
- Try disabling other extensions

**Issue: Overlay not appearing**
- Check if element is being detected
- Verify CSS is being applied
- Check z-index conflicts
- Try different overlay style

## Test Results Template

```
Test Date: _______________
Tester: ___________________
Browser: __________________
Version: 2.3.0

UNIT TESTS:
- SelectorEngine: ✓ / ✗
- FilterCore: ✓ / ✗
- ArticleDetector: ✓ / ✗
- DOMManipulator: ✓ / ✗

INTEGRATION TESTS:
- Yahoo News: ✓ / ✗
- BBC News: ✓ / ✗
- CNN: ✓ / ✗
- The Guardian: ✓ / ✗

EDGE CASES:
- Empty Keywords: ✓ / ✗
- Long Keywords: ✓ / ✗
- Special Characters: ✓ / ✗
- Rapid Scrolling: ✓ / ✗

PERFORMANCE:
- Memory Usage: _____ MB
- CPU Usage: _____ %
- Selector Speed: _____ ms

NOTES:
_________________________
_________________________
```

## Continuous Testing

### Automated Tests (Future)

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "SelectorEngine"

# Run with coverage
npm test -- --coverage
```

## Sign-off

- [ ] All tests passed
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Ready for release

---

**Testing Guide Version:** 1.0  
**Last Updated:** December 11, 2024
