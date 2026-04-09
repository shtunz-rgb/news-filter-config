"""
Skeep Ingestion Pipeline
========================
Scrapes all safe sections from CNN, BBC, and Ynet.
Extracts title, URL, image_url, dimensions, layout_type.
Captures BOTH image articles and text-only articles.
Checks against keyword_exclusions table.
Incrementally inserts new articles — existing URLs are skipped.
Expired articles (expires_at < NOW) are pruned at the start of each run.

Safe sections targeted:
  CNN  : cnn_sport(8), cnn_health(5), cnn_entertainment(6), cnn_style(7), cnn_travel(4)
  BBC  : bbc_sport_football(9), bbc_sport_formula1(10), bbc_sport_golf(11),
         bbc_sport_cricket(12), bbc_culture(13)
  Ynet : ynet_sport(22), ynet_tech(23), ynet_entertainment(24), ynet_culture(25)

Yahoo is excluded — it requires a headless browser (JS-rendered).

Fixes in this version:
  - CNN: <source> dimensions use single quotes — regex updated to match both
  - Ynet: imageHidden detection tightened; only mark text-only when class is explicit
  - Ynet: politically sensitive articles filtered via keyword_exclusions
  - Ynet: image URL stored in full (no truncation)
  - DB: articles table cleared before repopulation (clean slate)
  - Schema: image_width/height renamed to display_width/height
  - Schema: actual_width, actual_height, pixel_ratio added (read from image binary header)
"""

import re
import json
import struct
import time
import requests
from html import unescape
from datetime import datetime, timezone, timedelta

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
SUPABASE_URL = "https://uuxypxtlgvyzhhzxihky.supabase.co"
SERVICE_KEY  = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eHlweHRsZ3Z5emhoenhpaGt5Iiwicm9sZSI6"
    "InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgwMzI1NiwiZXhwIjoyMDkwMzc5MjU2fQ."
    "CCxISLukFLalGqD5xfvEu8nbpLt2FO-Me77ZE_pfDQk"
)
API_HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}
FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

TTL_HOURS = 48

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def clean(text: str) -> str:
    """Strip HTML tags, decode entities, normalise whitespace."""
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    return " ".join(text.split()).strip()

def word_count(text: str) -> int:
    return len(text.split())

def compute_layout(w, h, image_url=None) -> str:
    if w and h:
        ratio = w / h
        if ratio > 1.6:   return "image-horizontal"
        elif ratio < 0.8: return "image-vertical"
        else:             return "image-square"
    elif image_url:
        return "image-horizontal"
    return "unknown"

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def expires_iso() -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=TTL_HOURS)).isoformat()

def get_actual_dimensions(url: str) -> tuple[int | None, int | None]:
    """
    Read true pixel dimensions from the image binary header.
    Downloads only the first 4KB — enough for JPEG SOF, PNG IHDR, or WebP VP8 headers.
    This is the same method used by tools like imagy.app.
    Returns (width, height) or (None, None) on failure.
    """
    if not url:
        return None, None
    try:
        r = requests.get(url, headers=FETCH_HEADERS, timeout=10, stream=True)
        r.raise_for_status()
        data = b''
        for chunk in r.iter_content(4096):
            data += chunk
            if len(data) >= 4096:
                break
        r.close()

        # PNG: width at bytes 16-20, height at 20-24 (big-endian uint32)
        if data[:8] == b'\x89PNG\r\n\x1a\n':
            w = struct.unpack('>I', data[16:20])[0]
            h = struct.unpack('>I', data[20:24])[0]
            return w, h

        # JPEG: scan for SOF0/SOF1/SOF2 markers
        if data[:2] == b'\xff\xd8':
            i = 2
            while i < len(data) - 8:
                if data[i] != 0xff:
                    i += 1
                    continue
                marker = data[i + 1]
                if marker in (0xC0, 0xC1, 0xC2):
                    h = struct.unpack('>H', data[i + 5:i + 7])[0]
                    w = struct.unpack('>H', data[i + 7:i + 9])[0]
                    return w, h
                if i + 3 < len(data):
                    length = struct.unpack('>H', data[i + 2:i + 4])[0]
                    i += 2 + length
                else:
                    break
            return None, None

        # WebP VP8 (lossy)
        if data[0:4] == b'RIFF' and data[8:12] == b'WEBP':
            if data[12:16] == b'VP8 ' and len(data) >= 30:
                w = struct.unpack('<H', data[26:28])[0] & 0x3FFF
                h = struct.unpack('<H', data[28:30])[0] & 0x3FFF
                return w, h
            elif data[12:16] == b'VP8L' and len(data) >= 25:
                bits = struct.unpack('<I', data[21:25])[0]
                w = (bits & 0x3FFF) + 1
                h = ((bits >> 14) & 0x3FFF) + 1
                return w, h

        return None, None
    except Exception:
        return None, None


def fetch_html(url: str) -> str | None:
    try:
        r = requests.get(url, headers=FETCH_HEADERS, timeout=15)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"  ⚠️  fetch failed for {url}: {e}")
        return None

# ─────────────────────────────────────────────
# Load keyword exclusions from Supabase
# ─────────────────────────────────────────────
def load_exclusion_keywords() -> list[str]:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keyword_exclusions",
        headers=API_HEADERS,
        params={"select": "keyword"},
    )
    if r.status_code == 200:
        return [row["keyword"].lower() for row in r.json()]
    return []

def is_excluded(title: str, keywords: list[str]) -> tuple[bool, str | None]:
    title_lower = title.lower()
    for kw in keywords:
        if kw in title_lower:
            return True, kw
    return False, None

# ─────────────────────────────────────────────
# Load section IDs dynamically from Supabase
# ─────────────────────────────────────────────
def load_section_ids() -> dict[str, int]:
    """
    Fetch all sections from Supabase and return a dict mapping
    section_key -> id.  This avoids hardcoding IDs that may differ
    from what the DB actually assigned via SERIAL.
    """
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/sections",
        headers=API_HEADERS,
        params={"select": "id,section_key"},
    )
    if r.status_code == 200:
        return {row["section_key"]: row["id"] for row in r.json()}
    print(f"  ⚠️  Could not load section IDs: HTTP {r.status_code}")
    return {}

# ─────────────────────────────────────────────
# Clear articles table
# ─────────────────────────────────────────────
def prune_expired_articles():
    """Delete articles whose expires_at timestamp has passed."""
    now = now_iso()
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/articles",
        headers={**API_HEADERS, "Prefer": "return=minimal"},
        params={"expires_at": f"lt.{now}"},
    )
    if r.status_code in (200, 204):
        print("  ✅ Expired articles pruned.")
    else:
        print(f"  ⚠️  prune failed: HTTP {r.status_code} — {r.text[:120]}")

# ─────────────────────────────────────────────
# Supabase insert
# ─────────────────────────────────────────────
def insert_articles(articles: list[dict]) -> int:
    """Insert articles in batches of 50, skipping duplicates."""
    if not articles:
        return 0
    inserted = 0
    batch_headers = {
        **API_HEADERS,
        "Prefer": "resolution=ignore-duplicates,return=minimal",
    }
    # Insert in batches of 50
    for i in range(0, len(articles), 50):
        batch = articles[i:i+50]
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/articles",
            headers=batch_headers,
            data=json.dumps(batch),
        )
        if r.status_code in (200, 201):
            inserted += len(batch)
        else:
            # Fall back to row-by-row on batch error
            for article in batch:
                r2 = requests.post(
                    f"{SUPABASE_URL}/rest/v1/articles",
                    headers=batch_headers,
                    data=json.dumps(article),
                )
                if r2.status_code in (200, 201):
                    inserted += 1
                elif r2.status_code != 409:
                    print(f"  ❌ insert error HTTP {r2.status_code}: {r2.text[:120]}")
    return inserted

# ─────────────────────────────────────────────
# CNN Scraper
# ─────────────────────────────────────────────
CNN_SECTIONS = [
    {"section_key": "cnn_sport",         "url": "https://edition.cnn.com/sport"},
    {"section_key": "cnn_health",        "url": "https://edition.cnn.com/health"},
    {"section_key": "cnn_entertainment", "url": "https://edition.cnn.com/entertainment"},
    {"section_key": "cnn_style",         "url": "https://edition.cnn.com/style"},
    {"section_key": "cnn_travel",        "url": "https://edition.cnn.com/travel"},
]

def scrape_cnn_section(section: dict, exclusion_keywords: list[str]) -> list[dict]:
    html = fetch_html(section["url"])
    if not html:
        return []

    cards = re.findall(
        r'<li[^>]+data-open-link="(/\d{4}/\d{2}/\d{2}/[^"]+)"[^>]*>(.*?)</li>',
        html, re.DOTALL
    )

    results = []
    seen_urls = set()

    for path, card_html in cards:
        article_url = "https://edition.cnn.com" + path
        if article_url in seen_urls:
            continue
        seen_urls.add(article_url)

        # Title
        t = re.search(r'class="container__headline-text"[^>]*>(.*?)</span>', card_html, re.DOTALL)
        if not t:
            continue
        title = clean(t.group(1))
        if not title:
            continue

        # Keyword exclusion check
        excluded, reason = is_excluded(title, exclusion_keywords)

        # Image URL — prefer data-url attribute (most reliable on CNN)
        img_url_m = re.search(r'data-url="(https://media\.cnn\.com/[^"]+)"', card_html)
        if not img_url_m:
            img_url_m = re.search(
                r'<img\s[^>]*class="[^"]*image__dam-img[^"]*"[^>]*src="([^"]+)"',
                card_html, re.DOTALL
            )
        image_url = img_url_m.group(1) if img_url_m else None
        # Normalise to ?c=original (strip any existing query params)
        if image_url and "?" in image_url:
            image_url = image_url.split("?")[0] + "?c=original"

        # Display dimensions — handles both single and double quotes, both attribute orders.
        # Fixed: previous version had spurious spaces inside \d+ groups that prevented matching.
        src_m = re.search(
            r'<source\b[^>]*?'
            r'(?:'
            r'height=["\'](\d+)["\'][^>]*?width=["\'](\d+)["\']'
            r'|'
            r'width=["\'](\d+)["\'][^>]*?height=["\'](\d+)["\']'
            r')',
            card_html
        )
        if src_m:
            if src_m.group(1):   # height first
                dh, dw = int(src_m.group(1)), int(src_m.group(2))
            else:                # width first
                dw, dh = int(src_m.group(3)), int(src_m.group(4))
        else:
            dw, dh = None, None

        # Actual dimensions — read from image binary header (skip if no image)
        if image_url:
            aw, ah = get_actual_dimensions(image_url)
        else:
            aw, ah = None, None

        # Pixel ratio — actual / display (e.g. 4.0 for CNN retina)
        pixel_ratio = round(aw / dw, 2) if (aw and dw) else None

        # layout_type: text-only if no image, otherwise derived from actual dimensions
        if not image_url:
            layout = "text-only"
        else:
            layout = compute_layout(aw, ah, image_url)

        results.append({
            "section_id":       section["section_id"],
            "url":              article_url,
            "title":            title,
            "title_word_count": word_count(title),
            "has_image":        bool(image_url),
            "image_url":        image_url,
            "display_width":    dw,
            "display_height":   dh,
            "actual_width":     aw,
            "actual_height":    ah,
            "pixel_ratio":      pixel_ratio,
            "layout_type":      layout,
            "published_at":     None,
            "scraped_at":       now_iso(),
            "expires_at":       expires_iso(),
            "is_excluded":      excluded,
            "exclusion_reason": reason,
        })

    return results

# ─────────────────────────────────────────────
# BBC Scraper
# ─────────────────────────────────────────────
BBC_SPORT_SECTIONS = [
    {"section_key": "bbc_sport_football", "url": "https://www.bbc.com/sport/football"},
    {"section_key": "bbc_sport_formula1", "url": "https://www.bbc.com/sport/formula1"},
    {"section_key": "bbc_sport_golf",     "url": "https://www.bbc.com/sport/golf"},
    {"section_key": "bbc_sport_cricket",  "url": "https://www.bbc.com/sport/cricket"},
]

def scrape_bbc_sport_section(section: dict, exclusion_keywords: list[str]) -> list[dict]:
    html = fetch_html(section["url"])
    if not html:
        return []

    promos = re.findall(
        r'data-testid="promo"[^>]*>(.*?)(?=data-testid="promo"|$)',
        html, re.DOTALL
    )
    if not promos:
        promos = re.findall(r'(data-testid="promo".*?</div></div>)', html, re.DOTALL)

    results = []
    seen_urls = set()

    for promo_html in promos:
        link = re.search(r'href="(/sport/(?:[a-z0-9/-]+/)?articles/[a-z0-9]+)"', promo_html)
        if not link:
            continue
        article_url = "https://www.bbc.com" + link.group(1)
        if article_url in seen_urls:
            continue
        seen_urls.add(article_url)

        # Title
        t = re.search(r'aria-hidden="false">(.*?)</span>', promo_html, re.DOTALL)
        if not t:
            t = re.search(r'<h3[^>]*>(.*?)</h3>', promo_html, re.DOTALL)
        if not t:
            continue
        title = clean(t.group(1))
        if not title:
            continue

        excluded, reason = is_excluded(title, exclusion_keywords)

        # Image URL — prefer width 800, non-webp JPG
        img_widths = re.findall(
            r'https://ichef[.]bbci[.]co[.]uk/ace/standard/(\d+)/[^\s"\'<>]+[.]jpg(?!\s*\d)',
            promo_html
        )
        image_url = None
        dw = None
        dh = None
        if img_widths:
            best_w = str(max(img_widths, key=int))
            img_m = re.search(
                r'(https://ichef[.]bbci[.]co[.]uk/ace/standard/' + best_w + r'/[^\s"\' <>]+[.]jpg)',
                promo_html
            )
            if img_m:
                image_url = unescape(img_m.group(1))
                dw = int(best_w)
                dh = round(dw * 9 / 16)  # BBC encodes width in URL; height is derived

        # Actual dimensions from binary header (skip if no image)
        if image_url:
            aw, ah = get_actual_dimensions(image_url)
        else:
            aw, ah = None, None
        pixel_ratio = round(aw / dw, 2) if (aw and dw) else None
        layout = "text-only" if not image_url else compute_layout(aw, ah, image_url)

        results.append({
            "section_id":       section["section_id"],
            "url":              article_url,
            "title":            title,
            "title_word_count": word_count(title),
            "has_image":        bool(image_url),
            "image_url":        image_url,
            "display_width":    dw,
            "display_height":   dh,
            "actual_width":     aw,
            "actual_height":    ah,
            "pixel_ratio":      pixel_ratio,
            "layout_type":      layout,
            "published_at":     None,
            "scraped_at":       now_iso(),
            "expires_at":       expires_iso(),
            "is_excluded":      excluded,
            "exclusion_reason": reason,
        })

    return results

BBC_CULTURE_SECTION = {"section_key": "bbc_culture", "url": "https://www.bbc.com/culture"}

def scrape_bbc_culture(exclusion_keywords: list[str], section_id: int = None) -> list[dict]:
    html = fetch_html(BBC_CULTURE_SECTION["url"])
    if not html:
        return []

    cards = re.findall(
        r'data-testid="birmingham-card"[^>]*>(.*?)(?=data-testid="birmingham-card"|</section>|$)',
        html, re.DOTALL
    )

    results = []
    seen_urls = set()

    for card_html in cards:
        link = re.search(r'href="(/culture/article/[^"]+)"', card_html)
        if not link:
            continue
        article_url = "https://www.bbc.com" + link.group(1)
        if article_url in seen_urls:
            continue
        seen_urls.add(article_url)

        t = re.search(r'data-testid="card-headline[^"]*"[^>]*>(.*?)</[^>]+>', card_html, re.DOTALL)
        if not t:
            t = re.search(r'<h[23][^>]*>(.*?)</h[23]>', card_html, re.DOTALL)
        if not t:
            continue
        title = clean(t.group(1))
        if not title:
            continue

        excluded, reason = is_excluded(title, exclusion_keywords)

        img_variants = re.findall(
            r'https://ichef[.]bbci[.]co[.]uk/images/ic/(\d+)xn/([^\s"\' <>]+[.]jpg)',
            card_html
        )
        image_url = None
        dw = None
        dh = None
        if img_variants:
            best = max(img_variants, key=lambda x: int(x[0]))
            image_url = f"https://ichef.bbci.co.uk/images/ic/{best[0]}xn/{best[1]}"
            dw = int(best[0])
            dh = round(dw * 9 / 16)

        # Actual dimensions from binary header (skip if no image)
        if image_url:
            aw, ah = get_actual_dimensions(image_url)
        else:
            aw, ah = None, None
        pixel_ratio = round(aw / dw, 2) if (aw and dw) else None
        layout = "text-only" if not image_url else compute_layout(aw, ah, image_url)

        results.append({
            "section_id":       section_id,
            "url":              article_url,
            "title":            title,
            "title_word_count": word_count(title),
            "has_image":        bool(image_url),
            "image_url":        image_url,
            "display_width":    dw,
            "display_height":   dh,
            "actual_width":     aw,
            "actual_height":    ah,
            "pixel_ratio":      pixel_ratio,
            "layout_type":      layout,
            "published_at":     None,
            "scraped_at":       now_iso(),
            "expires_at":       expires_iso(),
            "is_excluded":      excluded,
            "exclusion_reason": reason,
        })

    return results

# ─────────────────────────────────────────────
# Ynet Scraper
# ─────────────────────────────────────────────
YNET_SECTIONS = [
    {"section_key": "ynet_sport",         "url": "https://www.ynet.co.il/sport"},
    {"section_key": "ynet_tech",          "url": "https://www.ynet.co.il/digital"},
    {"section_key": "ynet_entertainment", "url": "https://www.ynet.co.il/entertainment"},
    {"section_key": "ynet_culture",       "url": "https://www.ynet.co.il/entertainment"},
]

# Ynet-specific hard exclusion patterns — news/politics articles that leak into
# entertainment/sport sections and must never enter the replacement pool.
YNET_HARD_EXCLUSIONS = [
    r'איר[אן]',          # Iran
    r'מלחמ',             # war / warfare
    r'ירי',              # shooting / fire
    r'פיגוע',            # terror attack
    r'חמאס',             # Hamas
    r'נתניה',            # Netanyahu
    r'כנסת',             # Knesset
    r'ממשל',             # government
    r'בחיר',             # election
    r'משפט',             # trial / legal
    r'עצור|נעצר',        # arrested
    r'הרוג|נהרג',        # killed
    r'פצוע|נפצע',        # wounded
    r'רקט|טיל',          # rocket / missile
    r'חטוף|חטיפ',        # kidnapping / hostage
    r'מחאה|הפגנ',        # protest / demonstration
    r'שביתה',            # strike
    r'אנטישמ',           # antisemitism
    r'שואה',             # Holocaust
    r'גזענ',             # racism
]
YNET_HARD_EXCLUSION_RE = re.compile("|".join(YNET_HARD_EXCLUSIONS))

def ynet_is_news(title: str) -> bool:
    """Return True if the title looks like a news/politics article."""
    return bool(YNET_HARD_EXCLUSION_RE.search(title))

def scrape_ynet_section(section: dict, exclusion_keywords: list[str]) -> list[dict]:
    html = fetch_html(section["url"])
    if not html:
        return []

    results = []
    seen_urls = set()

    # ── Type 2 & 3: MultiImagesTopItemCol cards ──────────────────────────────
    # Split on the slotView class which wraps each article card
    raw_cards = re.split(r'(?=<div[^>]*class="[^"]*slotView[^"]*")', html)

    for card_html in raw_cards:
        if "MultiImagesTopItemCol" not in card_html:
            continue

        # Determine if image is explicitly hidden
        # Only mark as hidden if the imageHidden class is present on the image wrapper
        is_hidden = bool(re.search(r'class="[^"]*imageHidden[^"]*"', card_html))

        # URL
        url_m = re.search(r'href="(https://www\.ynet\.co\.il/[^/]+/article/[^"#]+)', card_html)
        if not url_m:
            continue
        article_url = url_m.group(1)
        if article_url in seen_urls:
            continue
        seen_urls.add(article_url)

        # Title — look for slotTitle anchor text
        t = re.search(r'class="[^"]*slotTitle[^"]*"[^>]*>.*?<a[^>]*>(.*?)</a>', card_html, re.DOTALL)
        if not t:
            # fallback: any anchor inside the card that has meaningful text
            t = re.search(r'href="https://www\.ynet\.co\.il/[^/]+/article/[^"]+">([^<]{5,120})<', card_html)
        if not t:
            continue
        title = clean(t.group(1))
        if not title or len(title) < 5:
            continue

        # Skip news/politics articles that leaked into the section
        if ynet_is_news(title):
            continue

        # Keyword exclusion
        excluded, reason = is_excluded(title, exclusion_keywords)

        # Image — full URL extraction
        img_m = re.search(
            r'<img\s[^>]*src="(https://ynet-pic1\.yit\.co\.il/[^"]+)"[^>]*width=["\'](\d+)["\'][^>]*height=["\'](\d+)["\']',
            card_html
        )
        if not img_m:
            img_m = re.search(
                r'<img\s[^>]*width=["\'](\d+)["\'][^>]*height=["\'](\d+)["\'][^>]*src="(https://ynet-pic1\.yit\.co\.il/[^"]+)"',
                card_html
            )
            if img_m:
                iw, ih, image_url = int(img_m.group(1)), int(img_m.group(2)), img_m.group(3)
            else:
                # Try data-src
                ds = re.search(r'data-src="(https://ynet-pic1\.yit\.co\.il/[^"]+)"', card_html)
                image_url = ds.group(1) if ds else None
                iw, ih = (400, 225) if image_url else (None, None)
        else:
            image_url = img_m.group(1)
            iw = int(img_m.group(2))
            ih = int(img_m.group(3))

        has_image = bool(image_url) and not is_hidden

        # Actual dimensions from binary header (only if image is visible)
        if has_image:
            aw, ah = get_actual_dimensions(image_url)
            pixel_ratio = round(aw / iw, 2) if (aw and iw) else None
        else:
            aw, ah, pixel_ratio = None, None, None

        layout = "text-only" if (is_hidden or not image_url) else compute_layout(aw, ah, image_url)

        # Timestamp
        ts_m = re.search(r'datetime="([^"]+)"', card_html)
        published_at = ts_m.group(1) if ts_m else None

        results.append({
            "section_id":       section["section_id"],
            "url":              article_url,
            "title":            title,
            "title_word_count": word_count(title),
            "has_image":        has_image,
            "image_url":        image_url,
            "display_width":    iw,
            "display_height":   ih,
            "actual_width":     aw,
            "actual_height":    ah,
            "pixel_ratio":      pixel_ratio,
            "layout_type":      layout,
            "published_at":     published_at,
            "scraped_at":       now_iso(),
            "expires_at":       expires_iso(),
            "is_excluded":      excluded,
            "exclusion_reason": reason,
        })

    # ── Type 1: MediaCarousel cards ──────────────────────────────────────────
    carousel_cards = re.findall(
        r'(<div[^>]*class="[^"]*slotView[^"]*"[^>]*>.*?MediaCarousel.*?</div>\s*</div>)',
        html, re.DOTALL
    )
    for card_html in carousel_cards:
        url_m = re.search(r'data-tb-link[^>]*href="(https://www\.ynet\.co\.il/[^"]+)"', card_html)
        if not url_m:
            continue
        article_url = url_m.group(1)
        if article_url in seen_urls:
            continue
        seen_urls.add(article_url)

        t = re.search(r'data-tb-title[^>]*>(.*?)</span>', card_html, re.DOTALL)
        if not t:
            continue
        title = clean(t.group(1))
        if not title:
            continue

        if ynet_is_news(title):
            continue

        excluded, reason = is_excluded(title, exclusion_keywords)

        img_m = re.search(
            r'<img\s[^>]*class="SiteImageMedia"[^>]*src="(https://ynet-pic1\.yit\.co\.il/[^"]+)"',
            card_html
        )
        image_url = img_m.group(1) if img_m else None

        # Actual dimensions from binary header
        aw, ah = get_actual_dimensions(image_url)
        # Display dimensions: carousel cards are always 190x190 square
        dw = 190 if image_url else None
        dh = 190 if image_url else None
        pixel_ratio = round(aw / dw, 2) if (aw and dw) else None

        results.append({
            "section_id":       section["section_id"],
            "url":              article_url,
            "title":            title,
            "title_word_count": word_count(title),
            "has_image":        bool(image_url),
            "image_url":        image_url,
            "display_width":    dw,
            "display_height":   dh,
            "actual_width":     aw,
            "actual_height":    ah,
            "pixel_ratio":      pixel_ratio,
            "layout_type":      compute_layout(aw, ah, image_url) if image_url else "unknown",
            "published_at":     None,
            "scraped_at":       now_iso(),
            "expires_at":       expires_iso(),
            "is_excluded":      excluded,
            "exclusion_reason": reason,
        })

    return results

# ─────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────
def run():
    print("=" * 60)
    print("SKEEP INGESTION PIPELINE")
    print(f"Started: {now_iso()}")
    print("=" * 60)

    # Step 1: Prune expired articles (TTL-based cleanup)
    print("\nPruning expired articles...")
    prune_expired_articles()

    # Step 2: Load section IDs dynamically from Supabase
    print("Loading section IDs from Supabase...")
    section_ids = load_section_ids()
    if not section_ids:
        print("  ❌ Cannot proceed without section IDs. Aborting.")
        return
    print(f"  ✅ Loaded {len(section_ids)} section ID(s).\n")

    # Inject live section_id into every section definition
    def resolve(section: dict) -> dict:
        key = section["section_key"]
        sid = section_ids.get(key)
        if sid is None:
            print(f"  ⚠️  section_key '{key}' not found in DB — skipping")
        return {**section, "section_id": sid}

    # Step 3: Load exclusion keywords
    exclusion_keywords = load_exclusion_keywords()
    print(f"Loaded {len(exclusion_keywords)} exclusion keyword(s).\n")

    total_inserted = 0

    # ── CNN ────────────────────────────────────────────────────────────────────────
    print("── CNN ───────────────────────────────────────────────────────")
    for section in CNN_SECTIONS:
        section = resolve(section)
        if section["section_id"] is None:
            continue
        print(f"  Scraping {section['section_key']} (id={section['section_id']}) ...")
        articles = scrape_cnn_section(section, exclusion_keywords)
        inserted = insert_articles(articles)
        excluded_count = sum(1 for a in articles if a["is_excluded"])
        print(f"  → {len(articles)} found | {excluded_count} excluded | {inserted} inserted")
        total_inserted += inserted
        time.sleep(1)

    # ── BBC Sport ────────────────────────────────────────────────────────────────────────
    print("\n── BBC Sport ───────────────────────────────────────────────")
    for section in BBC_SPORT_SECTIONS:
        section = resolve(section)
        if section["section_id"] is None:
            continue
        print(f"  Scraping {section['section_key']} (id={section['section_id']}) ...")
        articles = scrape_bbc_sport_section(section, exclusion_keywords)
        inserted = insert_articles(articles)
        excluded_count = sum(1 for a in articles if a["is_excluded"])
        print(f"  → {len(articles)} found | {excluded_count} excluded | {inserted} inserted")
        total_inserted += inserted
        time.sleep(1)

    # ── BBC Culture ──────────────────────────────────────────────────────────────────────
    print("\n── BBC Culture ─────────────────────────────────────────────")
    bbc_culture_resolved = resolve(BBC_CULTURE_SECTION)
    if bbc_culture_resolved["section_id"] is not None:
        print(f"  Scraping bbc_culture (id={bbc_culture_resolved['section_id']}) ...")
        articles = scrape_bbc_culture(exclusion_keywords, section_id=bbc_culture_resolved["section_id"])
        inserted = insert_articles(articles)
        excluded_count = sum(1 for a in articles if a["is_excluded"])
        print(f"  → {len(articles)} found | {excluded_count} excluded | {inserted} inserted")
        total_inserted += inserted
        time.sleep(1)

    # ── Ynet ───────────────────────────────────────────────────────────────────────────
    print("\n── Ynet ────────────────────────────────────────────────────")
    for section in YNET_SECTIONS:
        section = resolve(section)
        if section["section_id"] is None:
            continue
        print(f"  Scraping {section['section_key']} (id={section['section_id']}) ...")
        articles = scrape_ynet_section(section, exclusion_keywords)
        inserted = insert_articles(articles)
        excluded_count = sum(1 for a in articles if a["is_excluded"])
        print(f"  → {len(articles)} found | {excluded_count} excluded | {inserted} inserted")
        total_inserted += inserted
        time.sleep(1)

    print("\n" + "=" * 60)
    print(f"PIPELINE COMPLETE — {total_inserted} total articles inserted")
    print(f"Finished: {now_iso()}")
    print("=" * 60)

if __name__ == "__main__":
    run()
