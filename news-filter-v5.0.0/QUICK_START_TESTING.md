# News Filter Extension v5.0.0 - Quick Start Testing Guide

**Version**: 5.0.0  
**Date**: December 27, 2025  
**Status**: Ready for Testing

---

## 🚀 Quick Start (5 minutes)

### Step 1: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `news-filter-v5.0.0` folder
5. Verify extension appears in the list

### Step 2: Enable Debug Logging

1. Open DevTools (F12)
2. Go to Console tab
3. The extension will log all activity here

### Step 3: Test on a News Site

1. Navigate to **Yahoo News** (best for testing)
2. Click the extension icon
3. Enter a keyword: "politics"
4. Observe the filtering

---

## 📋 Quick Test Checklist

### Phase 2.5: CSS Injection (No Flash)
- [ ] Navigate to news site
- [ ] Check console for: "Preemptive CSS injected"
- [ ] No visible articles flash on page load
- [ ] Articles appear smoothly after ~500ms
- [ ] Console shows: "Preemptive CSS removed"

### Phase 4: Layout-Aware Substitution
- [ ] Set keyword and filter articles
- [ ] Check console for: "✓ Tier 1 (Layout-Aware) succeeded"
- [ ] Filtered articles are replaced (not red boxes)
- [ ] Replacement articles have similar dimensions
- [ ] No visual duplication

### External Feeds (Tier 2)
- [ ] Filter many articles to empty the pool
- [ ] Console shows: "Pool depleted"
- [ ] Placeholder appears instead of red box
- [ ] Message: "Content filtered for your preference"

### Performance
- [ ] Page loads smoothly
- [ ] No lag during scrolling
- [ ] No console errors
- [ ] Check DevTools Performance tab

---

## 🧪 Detailed Test Scenarios

### Scenario 1: Yahoo News (Infinite Scroll)

**Setup**:
1. Go to https://news.yahoo.com
2. Set keyword: "politics"
3. Open DevTools Console

**Test Steps**:
1. Observe initial filtering
2. Scroll down to load more articles
3. Check console for pool updates
4. Verify substitutions continue

**Expected Results**:
```
✓ Tier 1 (Layout-Aware) succeeded
Added 15 articles to pool (total: 45)
Pool Status: 40/45 available (5 used, max: 50)
```

### Scenario 2: BBC News (Strict Grid)

**Setup**:
1. Go to https://www.bbc.com/news
2. Set keyword: "business"
3. Open DevTools Console

**Test Steps**:
1. Observe grid layout
2. Filter articles
3. Check layout stability
4. Verify no empty spaces

**Expected Results**:
- Grid remains aligned
- No layout shifts
- Replacements fit grid cells

### Scenario 3: CNN (Card Layout)

**Setup**:
1. Go to https://www.cnn.com
2. Set keyword: "health"
3. Open DevTools Console

**Test Steps**:
1. Filter articles
2. Observe card replacements
3. Check for video auto-play issues
4. Verify card styling

**Expected Results**:
- Cards replaced correctly
- No audio from hidden videos
- Card dimensions match

---

## 🔍 What to Look For

### Console Logs (Good Signs)
```
✓ Preemptive CSS injected successfully
✓ Tier 1 (Layout-Aware) succeeded
✓ Added 15 articles to pool
✓ Pool Status: 40/45 available
✓ Preemptive CSS removed
✓ Cleanup CSS injected
```

### Console Errors (Issues to Report)
```
✗ Failed to inject preemptive CSS
✗ Compatibility check failed
✗ Failed to get replacement
✗ Failed to fetch from feeds
```

### Visual Indicators (Good)
- ✅ No red boxes
- ✅ No "flash" on page load
- ✅ Smooth article replacement
- ✅ Professional placeholder cards
- ✅ Stable layout

### Visual Issues (Report)
- ❌ Red overlay boxes
- ❌ Flash of filtered content
- ❌ Layout shifts
- ❌ Broken styling
- ❌ Duplicate articles

---

## 📊 Performance Checks

### DevTools Performance Tab

1. Open DevTools (F12)
2. Go to Performance tab
3. Click record
4. Navigate to news site
5. Stop recording
6. Analyze timeline

**Good Performance**:
- Initial scan: < 100ms
- No long tasks (> 50ms)
- Smooth 60fps scrolling
- No layout thrashing

**Issues to Report**:
- Scan > 200ms
- Long tasks detected
- Jank during scroll
- Layout thrashing

### Memory Usage

1. Open DevTools (F12)
2. Go to Memory tab
3. Take heap snapshot
4. Scroll for 2 minutes
5. Take another snapshot
6. Compare sizes

**Good Memory**:
- Stable memory growth
- No memory leaks
- Heap size < 50MB

**Issues to Report**:
- Unbounded growth
- Memory leaks
- Heap > 100MB

---

## 🐛 Troubleshooting

### Issue: Extension not filtering

**Solution**:
1. Check if extension is enabled
2. Verify keywords are set
3. Check console for errors
4. Reload the page

### Issue: Red boxes still appearing

**Solution**:
1. Verify Phase 4 is enabled in config
2. Check console for: "Tier 1 failed"
3. Check replacement pool size
4. Try Tier 2 (external feeds)

### Issue: Flash of content visible

**Solution**:
1. Check console for: "Preemptive CSS injected"
2. Verify CSS is injected early
3. Check for CSP violations
4. Try different site

### Issue: Performance lag

**Solution**:
1. Reduce pool size in config
2. Increase cache TTL
3. Disable external feeds
4. Check DevTools Performance tab

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________
Browser: Chrome _____ (version)
Site: ___________

Phase 2.5 (CSS Injection):
- Flash of content: [ ] None [ ] Minimal [ ] Significant
- CSS cleanup: [ ] Works [ ] Partial [ ] Fails
- Performance: [ ] Good [ ] Acceptable [ ] Poor

Phase 4 (Substitution):
- Tier 1 success: [ ] Yes [ ] Partial [ ] No
- Placeholder quality: [ ] Good [ ] Acceptable [ ] Poor
- Layout stability: [ ] Stable [ ] Minor shifts [ ] Major shifts

External Feeds (Tier 2):
- Feed fetching: [ ] Works [ ] Partial [ ] Fails
- Loading animation: [ ] Smooth [ ] Acceptable [ ] Jank

Overall:
- User experience: [ ] Excellent [ ] Good [ ] Acceptable [ ] Poor
- Performance: [ ] Excellent [ ] Good [ ] Acceptable [ ] Poor
- Stability: [ ] Stable [ ] Minor issues [ ] Crashes

Issues Found:
1. ___________
2. ___________

Suggestions:
1. ___________
2. ___________
```

---

## 📚 Full Documentation

For detailed information, see:

1. **PHASE4_INTEGRATION_GUIDE.md** - Integration instructions
2. **PHASE4_TESTING_GUIDE.md** - 25+ comprehensive tests
3. **Phase4_Revised_Architecture.md** - Technical design
4. **PHASE4_IMPLEMENTATION_SUMMARY.md** - Overview

---

## 🎯 Key Features to Test

### Pre-Emptive CSS Injection (Phase 2.5)
- [ ] No "flash" of filtered articles
- [ ] Smooth reveal of safe articles
- [ ] CSS properly cleaned up
- [ ] Works on all sites

### Layout-Aware Substitution (Phase 4)
- [ ] Tier 1: 90%+ replacement success
- [ ] Tier 2: External feeds work
- [ ] Tier 3: Placeholders display correctly
- [ ] Tier 4: Skeleton loaders animate
- [ ] Tier 5: Fallback concealment works

### External Feeds
- [ ] RSS feeds parse correctly
- [ ] NewsAPI integration works
- [ ] Feed caching works
- [ ] Rate limiting prevents abuse

### Placeholder Templates
- [ ] Generic placeholders look good
- [ ] Branded colors match site
- [ ] Loading animations are smooth
- [ ] Text is readable

### Performance
- [ ] Initial scan < 100ms
- [ ] Per-article substitution < 20ms
- [ ] Smooth scrolling (60fps)
- [ ] Memory usage bounded

---

## 🚨 Known Limitations

1. **CSP Restrictions**: Some sites (NYT) have strict CSP that prevents DOM manipulation
2. **Dynamic Content**: JavaScript-loaded content may not be detected initially
3. **Video Auto-play**: Audio may continue if video isn't properly paused
4. **Rate Limiting**: External feeds may be throttled on heavy usage

---

## 📞 Support

If you encounter issues:

1. **Check Console Logs**: Enable DEBUG mode for detailed logs
2. **Review Documentation**: See PHASE4_TESTING_GUIDE.md
3. **Check Performance**: Use DevTools Performance tab
4. **Report Issues**: Include console logs and test site

---

## ✅ Success Criteria

**Phase 2.5**: ✅ No flash of content  
**Phase 4**: ✅ 90%+ substitution success  
**External Feeds**: ✅ Fallback works when pool empty  
**Performance**: ✅ < 50ms per article  
**User Experience**: ✅ Professional appearance  

---

**Ready to Test!** 🎉

Load the extension and start testing. Check the console for detailed logs and report any issues you find.

Good luck! 🚀
