# Release Notes — v8.0.0

## Summary

Major release: **Database-backed image article substitution**. Filtered articles that contain images are now replaced with visually matching articles from the Supabase database, including image, headline, and URL replacement. Text-only articles continue to use the existing live-scrape pool path (unchanged).

---

## New: DB-Backed Image Substitution

### Background Service Worker (`background.js`)

- **New message handler: `fetchDBReplacement`** — receives image dimensions, title word count, keyword, and site identifier from the content script, queries the Supabase `articles` table, and returns the best-matching replacement article.
- **Matching algorithm** scores candidates on three criteria:
  1. **Image size proximity** — actual pixel dimensions compared to the filtered article's `naturalWidth`/`naturalHeight`, scored in 20%/40%/60% tiers.
  2. **Title word count proximity** — prefers articles within ±2 words, acceptable up to ±5, penalised beyond ±8.
  3. **Layout type** — hard filter: `image-horizontal`, `image-vertical`, or `image-square` must match.
- **Per-tab deduplication** — tracks used replacement URLs per tab to prevent the same article appearing twice on one page. Cleaned up on tab close.
- **Supabase REST API** — queries sections (filtered by site + `is_safe=true`) then articles (filtered by `is_excluded=false`, `has_image=true`, matching `layout_type`).

### Content Script (`content.js`)

- **New method: `performDBSubstitution(element, keyword)`** — analyses the filtered image article (reads `naturalWidth`/`naturalHeight` and counts headline words), sends a message to the background for a DB replacement, and calls `strategy.substituteWithImage()` on success.
- **Fallback to blur** — if the DB returns no match, or the strategy fails, the article falls back to the existing blur+label overlay. The user always sees something filtered, never an unhandled state.
- **`applyFilter()` updated** — image articles now route to `performDBSubstitution()` instead of `applyOverlay()`.

### Substitution Strategies (`substitution-strategies.js`)

- **New method on every strategy: `substituteWithImage(element, replacement, keyword)`** — handles image `src` replacement (including `srcset`, `data-src`, `<source>` cleanup), headline text replacement with truncation, link `href` replacement, and green border indicator.
- **Shared helpers** extracted: `_replaceImage()`, `_replaceHeadline()`, `_replaceLinks()`, `_addGreenBorder()` — used by all four site strategies to reduce duplication.
- **Image dimension locking** — after replacing `img.src`, the original display dimensions are locked via inline `width`/`height`/`object-fit: cover` to prevent layout shift.

---

## Unchanged

- **Text-only article substitution** — continues to use `performInstantSubstitution()` → `ContentPoolManager` → `ArticleMatcher` → `strategy.substitute()`. No changes to this path.
- **Popup UI** — no changes.
- **Remote config** — no changes.
- **CSP bypass for problematic domains** — no changes.

---

## Files Changed

| File | Change type |
|---|---|
| `manifest.json` | Version bump to 8.0.0 |
| `background.js` | Added Supabase query engine + `fetchDBReplacement` handler |
| `content.js` | Added `performDBSubstitution()`, updated `applyFilter()` |
| `substitution/substitution-strategies.js` | Added `substituteWithImage()` to all 4 strategies + shared helpers |
