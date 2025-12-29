# Phase 4 & Phase 2.5 Testing Guide
## News Filter Extension v5.0.0

**Date**: December 27, 2025  
**Status**: Testing Documentation  
**Version**: 5.0.0

---

## Test Environment Setup

### Prerequisites

1. Chrome/Chromium browser (version 90+)
2. Developer Tools (F12)
3. Test sites accessible (Yahoo, BBC, CNN, etc.)
4. Extension loaded in developer mode

### Loading the Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `/home/ubuntu/news-filter-v5.0.0` directory
5. Verify extension appears in the list

### Enable Debug Logging

Edit `content/modules/config/defaults.js`:

```javascript
export const DEFAULT_CONFIG = {
  DEBUG: true, // Enable detailed logging
  // ... other settings ...
};
```

Then reload the extension and open the page in DevTools console.

---

## Phase 2.5: Pre-emptive CSS Injection Tests

### Test 2.5.1: CSS Injection at Page Load

**Objective**: Verify CSS is injected before page renders

**Steps**:
1. Open DevTools (F12)
2. Go to Console tab
3. Navigate to a test site (e.g., `yahoo.com`)
4. Observe console output

**Expected Results**:
```
Preemptive CSS injected successfully
```

**Verification**:
- [ ] No visible articles on page load (0-100ms)
- [ ] Articles appear after ~500ms
- [ ] No "flash" of filtered articles
- [ ] Layout is stable (no jank)

### Test 2.5.2: CSS Cleanup After Scan

**Objective**: Verify CSS is cleaned up and safe articles are revealed

**Steps**:
1. Set keywords: "politics" in extension popup
2. Navigate to BBC News
3. Observe console output
4. Check if safe articles are visible

**Expected Results**:
```
Preemptive CSS removed
Cleanup CSS injected
```

**Verification**:
- [ ] Safe articles appear smoothly
- [ ] Filtered articles remain hidden
- [ ] No layout shifts after cleanup
- [ ] Fade-in animation is smooth

### Test 2.5.3: Multiple Article Selectors

**Objective**: Verify CSS injection works with multiple selectors

**Steps**:
1. Navigate to CNN (has multiple article containers)
2. Open DevTools Network tab
3. Check CSS file size and load time
4. Verify all article types are hidden initially

**Expected Results**:
- CSS injected: < 5ms
- CSS size: < 10KB
- All article types hidden initially

**Verification**:
- [ ] Card articles hidden
- [ ] Featured articles hidden
- [ ] Video articles hidden
- [ ] All article types revealed after scan

---

## Phase 4: Layout-Aware Substitution Tests

### Test 4.1: Tier 1 - Layout-Aware Replacement

**Objective**: Verify substitution with compatible articles

**Steps**:
1. Set keywords: "politics" in extension popup
2. Navigate to Yahoo News
3. Open DevTools Console
4. Observe substitutions

**Expected Results**:
```
✓ Tier 1 (Layout-Aware) succeeded
```

**Verification**:
- [ ] Filtered articles are replaced with safe ones
- [ ] Replacement articles have similar dimensions
- [ ] No visual duplication (original is hidden)
- [ ] Layout remains stable
- [ ] Success rate > 85%

### Test 4.2: Dimension Matching Tolerance

**Objective**: Verify dimension tolerance is working correctly

**Steps**:
1. Set keywords: "sports" on BBC News
2. Open DevTools Console
3. Filter articles and observe console logs
4. Check dimension differences

**Expected Results**:
```
Width mismatch: 8% > 5%
Height mismatch: 3% < 5%
Candidate is compatible
```

**Verification**:
- [ ] Tolerance is applied correctly per site
- [ ] BBC (±5%) is stricter than Yahoo (±20%)
- [ ] Aspect ratio is considered
- [ ] Incompatible articles are skipped

### Test 4.3: Replacement Pool Management

**Objective**: Verify pool is populated and managed correctly

**Steps**:
1. Navigate to Yahoo News (infinite scroll)
2. Open DevTools Console
3. Scroll down to load more articles
4. Observe pool status

**Expected Results**:
```
Added 15 articles to pool (total: 45)
Pool Status: 40/45 available (5 used, max: 50)
```

**Verification**:
- [ ] Pool is populated during initial scan
- [ ] New articles are added on scroll
- [ ] Used articles are marked and not reused
- [ ] Pool size doesn't exceed max (50)
- [ ] De-duplication works (no duplicate URLs)

### Test 4.4: Tier 2 - External Feed Fallback

**Objective**: Verify external feeds work when pool is empty

**Steps**:
1. Set keywords: "technology" on a site with few articles
2. Filter most articles to empty the pool
3. Observe console for Tier 2 activation
4. Check if placeholder appears

**Expected Results**:
```
Pool depleted, attempting Tier 2 (External Feed)
Fetched 5 articles from external feeds
✓ Tier 2 (External Feed) succeeded
```

**Verification**:
- [ ] Tier 2 is triggered when pool is empty
- [ ] External feeds are fetched successfully
- [ ] Loading placeholder appears
- [ ] Content loads asynchronously
- [ ] No blocking of page interaction

### Test 4.5: Tier 3 - Generic Placeholder

**Objective**: Verify generic placeholder displays correctly

**Steps**:
1. Disable external feeds in site config
2. Empty the replacement pool
3. Filter an article
4. Observe placeholder

**Expected Results**:
- Generic placeholder card appears
- Message: "Content filtered for your preference"
- Branded styling applied

**Verification**:
- [ ] Placeholder is visible and readable
- [ ] Correct keyword is displayed
- [ ] Layout is preserved
- [ ] No console errors

### Test 4.6: Tier 4 - Skeleton Loader

**Objective**: Verify skeleton loader animates correctly

**Steps**:
1. Configure slow network in DevTools (3G)
2. Trigger external feed fetch
3. Observe skeleton loader animation
4. Wait for content to load

**Expected Results**:
- Skeleton loader appears with animation
- Smooth loading animation
- Content replaces skeleton after load

**Verification**:
- [ ] Skeleton is visible during load
- [ ] Animation is smooth (60fps)
- [ ] Content loads and replaces skeleton
- [ ] No layout shift when content loads

### Test 4.7: Tier 5 - Element Concealment

**Objective**: Verify fallback concealment works

**Steps**:
1. Disable all tiers except Tier 5
2. Filter an article
3. Observe element is hidden

**Expected Results**:
- Element is hidden with `visibility: hidden`
- Layout is preserved (no collapse)
- Element is not visible to user

**Verification**:
- [ ] Element is invisible
- [ ] Layout doesn't collapse
- [ ] No console errors

---

## Site-Specific Tests

### Test 4.8: Yahoo News (Infinite Scroll)

**Objective**: Verify substitution works with infinite scroll

**Steps**:
1. Set keywords: "politics"
2. Navigate to Yahoo News
3. Scroll down multiple times
4. Observe substitutions and pool management

**Expected Results**:
- Initial articles are substituted
- New articles loaded via infinite scroll
- Pool is continuously updated
- No duplicate articles shown

**Verification**:
- [ ] Substitution works on initial load
- [ ] Substitution works on scroll
- [ ] Pool is updated with new articles
- [ ] No visual duplication
- [ ] No memory leaks (pool size stable)

### Test 4.9: BBC News (Strict Grid)

**Objective**: Verify substitution works with strict grid layout

**Steps**:
1. Set keywords: "business"
2. Navigate to BBC News
3. Observe substitutions
4. Check layout stability

**Expected Results**:
- Dimension tolerance: ±5%
- Substitutions maintain grid alignment
- No layout shifts
- Grid structure preserved

**Verification**:
- [ ] Replacements fit grid cells
- [ ] No empty spaces in grid
- [ ] Alignment is preserved
- [ ] No visual artifacts

### Test 4.10: CNN (Card-Based Layout)

**Objective**: Verify substitution works with card layouts

**Steps**:
1. Set keywords: "health"
2. Navigate to CNN
3. Observe card replacements
4. Check for video auto-play issues

**Expected Results**:
- Cards are replaced with compatible cards
- No auto-play audio from replaced videos
- Card styling is consistent

**Verification**:
- [ ] Cards are replaced correctly
- [ ] No audio plays from hidden videos
- [ ] Card dimensions match
- [ ] No console errors

### Test 4.11: The Guardian (DCR Cards)

**Objective**: Verify substitution works with DCR cards

**Steps**:
1. Set keywords: "world"
2. Navigate to The Guardian
3. Observe DCR card replacements

**Expected Results**:
- DCR cards are detected and replaced
- Card styling is preserved
- No layout issues

**Verification**:
- [ ] Cards are replaced
- [ ] Styling is consistent
- [ ] No console errors

---

## Performance Tests

### Test 4.12: Initial Scan Performance

**Objective**: Measure performance of initial page scan

**Steps**:
1. Open DevTools Performance tab
2. Navigate to test site
3. Record performance
4. Analyze timeline

**Expected Results**:
- Initial scan: < 100ms
- CSS injection: < 5ms
- Pool initialization: < 50ms
- Total overhead: < 150ms

**Verification**:
- [ ] Page load time not significantly impacted
- [ ] No jank or visual stuttering
- [ ] Smooth scrolling maintained

### Test 4.13: Substitution Performance

**Objective**: Measure performance per substitution

**Steps**:
1. Open DevTools Performance tab
2. Filter articles
3. Measure time per substitution
4. Analyze timeline

**Expected Results**:
- Per-article substitution: < 20ms
- Layout validator: < 5ms
- DOM manipulation: < 10ms

**Verification**:
- [ ] Substitutions are fast
- [ ] No blocking operations
- [ ] Smooth user experience

### Test 4.14: Memory Usage

**Objective**: Verify memory usage is bounded

**Steps**:
1. Open DevTools Memory tab
2. Navigate to infinite scroll site
3. Scroll for 2 minutes
4. Take heap snapshots

**Expected Results**:
- Memory growth is linear
- Pool size is bounded (max 50 items)
- No memory leaks

**Verification**:
- [ ] Memory doesn't grow unbounded
- [ ] Heap snapshots show stable size
- [ ] No detached DOM nodes

### Test 4.15: Cache Effectiveness

**Objective**: Verify caching improves performance

**Steps**:
1. Set keywords and navigate to site
2. Scroll and trigger multiple substitutions
3. Observe cache hits in console
4. Compare with cache disabled

**Expected Results**:
```
Using cached dimensions
Cache hit rate: > 80%
```

**Verification**:
- [ ] Cache hits are logged
- [ ] Performance improves with cache
- [ ] Cache expires correctly (5s)

---

## Edge Case Tests

### Test 4.16: Empty Pool on Heavy News Day

**Objective**: Verify system handles empty pool gracefully

**Steps**:
1. Set keywords that match many articles
2. Filter until pool is empty
3. Continue filtering
4. Observe fallback behavior

**Expected Results**:
```
Replacement pool is EMPTY - will need to use external feeds
```

**Verification**:
- [ ] System doesn't crash
- [ ] Fallback tiers are activated
- [ ] User experience is maintained

### Test 4.17: No Compatible Replacements

**Objective**: Verify system handles no compatible articles

**Steps**:
1. Set keywords that match most articles
2. Ensure remaining articles have different dimensions
3. Filter articles
4. Observe placeholder fallback

**Expected Results**:
- No compatible replacement found
- Generic placeholder displayed
- No console errors

**Verification**:
- [ ] Placeholder is shown
- [ ] Layout is preserved
- [ ] No visual artifacts

### Test 4.18: Rapid Scrolling

**Objective**: Verify system handles rapid scrolling

**Steps**:
1. Navigate to infinite scroll site
2. Scroll rapidly (multiple times per second)
3. Observe substitutions and pool management
4. Check for race conditions

**Expected Results**:
- System handles rapid scrolling
- No race conditions
- Pool is updated correctly
- No console errors

**Verification**:
- [ ] No errors during rapid scroll
- [ ] Substitutions are consistent
- [ ] Pool state is correct

### Test 4.19: Multiple Keywords

**Objective**: Verify system handles multiple keywords

**Steps**:
1. Set keywords: "politics", "sports", "health"
2. Navigate to news site
3. Observe filtering and substitution
4. Check keyword tracking

**Expected Results**:
- Multiple keywords are matched
- Correct keyword is tracked per article
- Substitutions work correctly

**Verification**:
- [ ] All keywords are matched
- [ ] Keyword is correctly identified
- [ ] Substitutions are consistent

### Test 4.20: CSS Injection with CSP

**Objective**: Verify CSS injection works with strict CSP

**Steps**:
1. Navigate to site with strict CSP (e.g., NYT)
2. Observe CSS injection behavior
3. Check console for CSP violations
4. Verify fallback behavior

**Expected Results**:
- CSS injection respects CSP
- No CSP violations
- Fallback to overlay mode

**Verification**:
- [ ] No CSP violations in console
- [ ] Extension still functions
- [ ] Overlay mode is used as fallback

---

## User Experience Tests

### Test 4.21: Visual Stability

**Objective**: Verify layout remains stable during filtering

**Steps**:
1. Navigate to news site
2. Set keywords and enable filtering
3. Observe page layout
4. Check for layout shifts (CLS)

**Expected Results**:
- Layout is stable
- No unexpected shifts
- CLS score: < 0.1

**Verification**:
- [ ] No visual jank
- [ ] Layout is predictable
- [ ] Smooth scrolling maintained

### Test 4.22: Placeholder Appearance

**Objective**: Verify placeholders look professional

**Steps**:
1. Trigger placeholder display
2. Observe appearance on different sites
3. Check branding and styling
4. Verify readability

**Expected Results**:
- Placeholders are well-designed
- Branding is appropriate
- Text is readable
- Layout is preserved

**Verification**:
- [ ] Placeholders look professional
- [ ] Branding matches site
- [ ] No visual artifacts

### Test 4.23: No Flash of Content

**Objective**: Verify no "flash" of filtered content

**Steps**:
1. Set keywords
2. Navigate to site
3. Observe page load carefully
4. Record video if possible

**Expected Results**:
- No visible filtered articles
- Smooth reveal of safe articles
- No "flash" effect

**Verification**:
- [ ] No flash observed
- [ ] Smooth transition
- [ ] Professional appearance

---

## Regression Tests

### Test 4.24: Existing Functionality

**Objective**: Verify existing features still work

**Steps**:
1. Test keyword addition/removal
2. Test enable/disable filtering
3. Test drawer functionality
4. Test filtered article counter

**Expected Results**:
- All existing features work
- No regressions
- No console errors

**Verification**:
- [ ] Keywords work correctly
- [ ] Enable/disable works
- [ ] Drawer shows correct articles
- [ ] Counter is accurate

### Test 4.25: Backward Compatibility

**Objective**: Verify old configuration still works

**Steps**:
1. Use old site strategies
2. Verify fallback behavior
3. Check overlay mode still works
4. Test on unsupported sites

**Expected Results**:
- Old configuration works
- Fallback to overlay mode
- Default site strategy works

**Verification**:
- [ ] Old configs work
- [ ] Overlay mode works
- [ ] Default strategy works

---

## Test Results Template

### Test Execution Report

```
Date: ___________
Tester: ___________
Browser: Chrome _____ (version)
Extension: v5.0.0

Phase 2.5 Tests:
- Test 2.5.1: [ ] PASS [ ] FAIL
- Test 2.5.2: [ ] PASS [ ] FAIL
- Test 2.5.3: [ ] PASS [ ] FAIL

Phase 4 Tests:
- Test 4.1: [ ] PASS [ ] FAIL
- Test 4.2: [ ] PASS [ ] FAIL
- Test 4.3: [ ] PASS [ ] FAIL
- ... (continue for all tests)

Issues Found:
1. ___________
2. ___________

Performance Metrics:
- Initial Scan: _____ ms
- Per-Article Substitution: _____ ms
- Memory Usage: _____ MB

Overall Result: [ ] PASS [ ] FAIL

Notes:
___________
```

---

## Continuous Testing

### Automated Tests (TODO)

Create unit tests for:
- LayoutValidator dimension matching
- ReplacementPool management
- SubstitutionManager tier logic
- CSSInjectionManager CSS generation
- ExternalFeedManager feed parsing

### Manual Testing Schedule

- **Weekly**: Core functionality tests (4.1-4.7)
- **Bi-weekly**: Site-specific tests (4.8-4.11)
- **Monthly**: Performance tests (4.12-4.15)
- **Per-release**: All tests (4.1-4.25)

---

## Known Limitations

1. **CSP Restrictions**: Some sites (NYT) have strict CSP that prevents DOM manipulation
2. **Dynamic Content**: Some sites load content via JavaScript that may not be detected
3. **Video Content**: Auto-play videos may continue in background if not properly handled
4. **Rate Limiting**: External feeds may be rate-limited on heavy usage

---

## Support

For test failures or issues:
1. Check console logs (enable DEBUG mode)
2. Review `PHASE4_INTEGRATION_GUIDE.md` for troubleshooting
3. Check `Phase4_Revised_Architecture.md` for design details
4. File issues with test results and console logs
