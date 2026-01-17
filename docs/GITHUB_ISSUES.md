# GitHub Issues - Redundancies & Optimization Opportunities

Generated from codebase analysis. Copy each issue below to create GitHub issues.

---

## HIGH PRIORITY

---

### Issue #1: Extract shared lightbox module from gallery files

**Labels:** `refactor`, `javascript`, `high-priority`, `DRY`

**Description:**

The `gallery.js` and `fanclub-gallery.js` files share approximately 60-70% identical code. This duplication makes maintenance difficult and increases the JavaScript bundle size unnecessarily.

**Duplicated Code:**

| Function | gallery.js | fanclub-gallery.js | Lines |
|----------|------------|-------------------|-------|
| `createLightboxStructure()` | 472-524 | 392-435 | ~50 |
| `attachLightboxListeners()` | 531-552 | 442-457 | ~20 |
| `handleKeyboardNav()` | 708-732 | 593-615 | ~25 |
| `initKeyboardNav()` | 692-696 | 584-586 | ~5 |
| `formatDate()` | 177-187 | 152-162 | ~10 |
| `sortMedia()` / `sortAllMedia()` | 151-164 | 130-139 | ~15 |
| `showPrevious()` | 640-655 | 530-543 | ~15 |
| `showNext()` | 662-677 | 550-563 | ~15 |
| `closeLightbox()` | 618-633 | 510-523 | ~15 |
| Lightbox button markup | 484-515 | 402-428 | ~30 |

**Proposed Solution:**

Create `assets/js/lightbox.js` containing:
- `createLightbox(containerSelector)` - Creates lightbox DOM structure
- `attachLightboxEvents(lightbox, callbacks)` - Binds keyboard and click events
- `showLightboxItem(lightbox, items, index)` - Displays media in lightbox
- `closeLightbox(lightbox)` - Closes and cleans up lightbox

Then refactor both gallery files to import and use this shared module.

**Files to Modify:**
- [ ] Create `assets/js/lightbox.js` (new file)
- [ ] Refactor `assets/js/gallery.js`
- [ ] Refactor `assets/js/fanclub-gallery.js`

**Estimated Impact:**
- ~200+ lines of duplicate code removed
- Easier maintenance (fix bugs in one place)
- Consistent lightbox behavior across public and fan club galleries

**Acceptance Criteria:**
- [ ] Both galleries function identically to current behavior
- [ ] Keyboard navigation works (ESC, Left Arrow, Right Arrow)
- [ ] Click outside to close works
- [ ] Image counter displays correctly
- [ ] No regression in accessibility (ARIA attributes preserved)

---

### Issue #2: Create shared JavaScript utilities module

**Labels:** `refactor`, `javascript`, `high-priority`, `DRY`

**Description:**

Several utility functions are duplicated across 5-7 JavaScript files. This violates the DRY principle and makes updates error-prone.

**Duplicated Functions:**

#### `formatDate(isoDateString)`
Converts ISO date strings to formatted display dates using `Intl.DateTimeFormat`.

| File | Lines |
|------|-------|
| `gallery.js` | 177-187 |
| `fanclub-gallery.js` | 152-162 |
| `featured-release.js` | 148-161 |
| `releases.js` | 129-143 |
| `announcements.js` | 98-113 |

#### `displayError(containerId, message)`
Displays error messages in specified containers with `role="alert"`.

| File | Lines |
|------|-------|
| `gallery.js` | 92-105 |
| `fanclub-gallery.js` | 101-111 |
| `featured-release.js` | 318-337 |
| `releases.js` | 96-111 |
| `announcements.js` | 68-82 |

#### `fetchJSON(url)` pattern
Async fetch with error handling and console logging.

| File | Lines |
|------|-------|
| `gallery.js` | 56-84 |
| `fanclub-gallery.js` | 73-94 |
| `featured-release.js` | 73-104 |
| `releases.js` | 56-84 |
| `announcements.js` | 45-62 |

#### `onDOMReady(callback)` pattern
DOMContentLoaded initialization check.

| File | Lines |
|------|-------|
| `gallery.js` | 770-774 |
| `fanclub-gallery.js` | 635-639 |
| `announcements.js` | 388-393 |
| `releases.js` | 395-401 |
| `message.js` | 343-348 |
| `fanclub-auth.js` | 680-686 |
| `featured-release.js` | 459-464 |

**Proposed Solution:**

Create `assets/js/utils.js`:

```javascript
/**
 * Shared utility functions for dURT nURS website
 */

/**
 * Formats ISO date string for display
 * @param {string} isoDate - Date in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "November 15, 2024")
 */
export function formatDate(isoDate) {
  const date = new Date(isoDate + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Fetches JSON data with error handling
 * @param {string} url - URL to fetch
 * @returns {Promise<any>} Parsed JSON data
 */
export async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

/**
 * Displays error message in container
 * @param {string} containerId - ID of container element
 * @param {string} message - Error message to display
 */
export function displayError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="error-message" role="alert">
        <p>${message}</p>
      </div>
    `;
  }
}

/**
 * Executes callback when DOM is ready
 * @param {Function} callback - Function to execute
 */
export function onDOMReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}
```

**Files to Modify:**
- [ ] Create `assets/js/utils.js` (new file)
- [ ] Update `assets/js/gallery.js` to import utils
- [ ] Update `assets/js/fanclub-gallery.js` to import utils
- [ ] Update `assets/js/featured-release.js` to import utils
- [ ] Update `assets/js/releases.js` to import utils
- [ ] Update `assets/js/announcements.js` to import utils
- [ ] Update `assets/js/message.js` to import utils
- [ ] Update `assets/js/fanclub-auth.js` to import utils

**Note:** Since this is a vanilla JS site without a bundler, consider using ES6 modules with `type="module"` on script tags, or concatenating files for production.

**Estimated Impact:**
- ~150+ lines of duplicate code removed
- Single source of truth for utility functions
- Easier testing and maintenance

**Acceptance Criteria:**
- [ ] All existing functionality preserved
- [ ] Date formatting works identically
- [ ] Error messages display correctly
- [ ] No console errors on any page

---

### Issue #3: Evaluate static site generator or HTML templating

**Labels:** `enhancement`, `architecture`, `high-priority`, `discussion`

**Description:**

Every HTML file in the project contains identical boilerplate that must be manually synchronized:

- **Head section:** ~100 lines (meta tags, Open Graph, fonts, CSS imports)
- **Navigation header:** ~80 lines (logo, mobile toggle, nav links)
- **Footer:** ~40 lines (links, copyright)

With 10 HTML pages, this results in **2,200+ lines of duplicate markup**.

**Current Pain Points:**

1. Adding a new nav link requires editing 10 files
2. Updating meta tags requires editing 10 files
3. Footer changes require editing 10 files
4. Risk of inconsistencies between pages
5. Cognitive overhead when making site-wide changes

**Pages Affected:**
- `index.html`
- `about.html`
- `news.html`
- `releases.html`
- `gallery.html`
- `contact.html`
- `fanclub.html`
- `privacy.html`
- `terms.html`
- `message.html`

**Options to Consider:**

#### Option A: Static Site Generator (Recommended)
Tools like **11ty (Eleventy)**, **Hugo**, or **Jekyll** would allow:
- Shared layouts/templates
- Partials for header/footer/nav
- Build step generates static HTML
- Markdown support for content pages
- Still deploys as static files to GitHub Pages

**Pros:** Industry standard, powerful, good documentation
**Cons:** Adds build step, learning curve

#### Option B: Simple HTML Includes (Build Script)
Create a simple Node.js or Python script that:
- Reads partial HTML files (`_partials/head.html`, `_partials/nav.html`, etc.)
- Inserts them into page templates
- Outputs complete HTML files

**Pros:** Minimal tooling, easy to understand
**Cons:** Custom solution, less flexible

#### Option C: Client-Side Includes (Not Recommended)
Use JavaScript to load header/footer dynamically.

**Pros:** No build step
**Cons:** SEO impact, flash of unstyled content, requires JS

**Recommendation:**

**11ty (Eleventy)** is recommended because:
- Zero-config for simple sites
- Works with existing HTML (no rewrite needed)
- Nunjucks templating is intuitive
- Excellent GitHub Pages integration
- Active community and documentation

**Proposed File Structure with 11ty:**

```
durtnurs.github.io/
├── _includes/
│   ├── head.njk
│   ├── header.njk
│   └── footer.njk
├── _layouts/
│   └── base.njk
├── _site/              # Generated output
├── assets/             # Unchanged
├── index.njk           # Uses layout
├── about.njk
├── ...
├── .eleventy.js        # Config
└── package.json
```

**Estimated Impact:**
- ~60% reduction in HTML file sizes
- Single source of truth for shared markup
- Faster development for new pages
- Reduced risk of inconsistencies

**Acceptance Criteria:**
- [ ] All pages render identically to current site
- [ ] GitHub Pages deployment still works
- [ ] Development workflow documented
- [ ] Build time under 5 seconds

**Discussion Points:**
- [ ] Team familiarity with static site generators
- [ ] Acceptable complexity increase for build step
- [ ] Preferred templating language (Nunjucks, Liquid, etc.)

---

## MEDIUM PRIORITY

---

### Issue #4: Create CSS utility classes for common patterns

**Labels:** `refactor`, `css`, `medium-priority`, `DRY`

**Description:**

`components.css` contains repeated patterns for borders, shadows, and transitions that could be extracted into reusable utility classes.

**Repeated Patterns:**

#### Border Pattern (16+ occurrences)
```css
border: var(--border-width) solid var(--color-iron-gray);
```

#### Shadow Patterns (10+ occurrences each)
```css
box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);
box-shadow: var(--shadow-lg);
```

#### Transition Patterns (15+ occurrences each)
```css
transition: color var(--transition-base);
transition: all var(--transition-base);
transition: transform var(--transition-base), box-shadow var(--transition-base);
```

#### Hover Lift Pattern (5+ occurrences)
```css
&:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

**Proposed Solution:**

Add utility classes to `variables.css` or create `utilities.css`:

```css
/* ============================================
   UTILITY CLASSES
   Reusable single-purpose classes
   ============================================ */

/* Borders */
.u-border { border: var(--border-width) solid var(--border-color); }
.u-border-primary { border: var(--border-width) solid var(--color-primary); }
.u-border-none { border: none; }

/* Shadows */
.u-shadow-sm { box-shadow: var(--shadow-sm); }
.u-shadow-md { box-shadow: var(--shadow-md); }
.u-shadow-lg { box-shadow: var(--shadow-lg); }
.u-shadow-xl { box-shadow: var(--shadow-xl); }
.u-shadow-none { box-shadow: none; }

/* Transitions */
.u-transition { transition: all var(--transition-base); }
.u-transition-fast { transition: all var(--transition-fast); }
.u-transition-slow { transition: all var(--transition-slow); }
.u-transition-color { transition: color var(--transition-base); }

/* Interactive States */
.u-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.u-hover-glow:hover {
  box-shadow: 0 0 20px var(--color-primary);
}
```

**Files to Modify:**
- [ ] Add utility classes to `assets/css/variables.css` or create new `assets/css/utilities.css`
- [ ] Optionally refactor `components.css` to use utilities (can be done incrementally)

**Estimated Impact:**
- ~100+ lines of CSS reduced through reuse
- Consistent styling patterns
- Easier to add new components with consistent behavior

**Acceptance Criteria:**
- [ ] Utility classes documented in code comments
- [ ] Existing components unchanged (utilities are additive)
- [ ] No visual regression

---

### Issue #5: Standardize JSON data schemas

**Labels:** `refactor`, `data`, `medium-priority`, `consistency`

**Description:**

The three JSON data files use inconsistent naming conventions, date formats, and data structures.

**Inconsistencies Found:**

#### Date Format
| File | Property | Example | Format |
|------|----------|---------|--------|
| `gallery.json` | `date` | `"2024-5-29"` | Non-standard (missing leading zeros) |
| `releases.json` | `releaseDate` | `"2024-11-15"` | ISO 8601 |
| `announcements.json` | `date` | `"2024-11-20"` | ISO 8601 |

#### Property Naming
| Concept | gallery.json | releases.json | announcements.json |
|---------|--------------|---------------|-------------------|
| Main image | `filename` | `coverArt` | N/A |
| Image alt text | `alt` (implicit) | `coverArtAlt` | N/A |
| Short text | `description` | `description` | `excerpt` |
| Full text | N/A | N/A | `content` |
| Video URL | `embedUrl` | N/A | N/A |

#### Boolean Flags
All files use `featured` and gallery uses `public` - these are consistent.

#### Placeholder Values
- `releases.json` uses `"#"` for placeholder streaming links
- This is acceptable but should be documented

**Proposed Schema Standards:**

```javascript
// Date: Always use ISO 8601 format
"date": "2024-05-29"  // NOT "2024-5-29"

// Images: Use consistent naming
"image": "path/to/image.jpg",
"imageAlt": "Description for screen readers"

// Or for thumbnails:
"thumbnail": "path/to/thumb.jpg",
"fullImage": "path/to/full.jpg"

// Text content:
"summary": "Short description (< 150 chars)",
"description": "Full description with details"

// Flags: Boolean only
"featured": true,
"public": false
```

**Files to Modify:**
- [ ] `assets/data/gallery.json` - Fix date formats (add leading zeros)
- [ ] Document schema conventions in `CLAUDE.md` or new `docs/DATA_SCHEMA.md`

**Specific Fixes for gallery.json:**

Line 10: `"date": "2024-5-29"` → `"date": "2024-05-29"`
Line 22: `"date": "2024-3-17"` → `"date": "2024-03-17"`
Line 34: `"date": "2024-1-5"` → `"date": "2024-01-05"`
(Check all date fields)

**Estimated Impact:**
- Consistent date parsing across all modules
- Reduced cognitive load when working with data
- Better documentation for future contributors

**Acceptance Criteria:**
- [ ] All dates in ISO 8601 format (YYYY-MM-DD with leading zeros)
- [ ] Schema documented
- [ ] All JavaScript date parsing still works

---

### Issue #6: Consolidate hero section CSS variants

**Labels:** `refactor`, `css`, `medium-priority`, `DRY`

**Description:**

`components.css` contains multiple `.hero--[page]` modifier classes with repeated responsive media query structures.

**Current Pattern (repeated 6 times):**

```css
/* Lines ~665-688: About hero */
.hero--about .hero__title { font-size: var(--font-size-4xl); }
.hero--about .hero__subtitle { font-size: var(--font-size-lg); }
@media (min-width: 768px) {
  .hero--about .hero__title { font-size: var(--font-size-5xl); }
  .hero--about .hero__subtitle { font-size: var(--font-size-xl); }
}

/* Lines ~1294-1320: News hero */
.hero--news .hero__title { font-size: var(--font-size-4xl); }
/* ... same pattern ... */

/* Lines ~1339-1373: Releases hero */
/* Lines ~1895-1930: Gallery hero */
/* Lines ~2465-2491: Contact hero */
/* etc. */
```

**Proposed Solution:**

Use CSS custom properties for hero customization instead of class variants:

```css
/* Base hero with customizable properties */
.hero {
  --hero-title-size: var(--font-size-4xl);
  --hero-title-size-md: var(--font-size-5xl);
  --hero-subtitle-size: var(--font-size-lg);
  --hero-subtitle-size-md: var(--font-size-xl);
}

.hero__title {
  font-size: var(--hero-title-size);
}

.hero__subtitle {
  font-size: var(--hero-subtitle-size);
}

@media (min-width: 768px) {
  .hero__title {
    font-size: var(--hero-title-size-md);
  }
  .hero__subtitle {
    font-size: var(--hero-subtitle-size-md);
  }
}

/* Page-specific overrides (if needed) */
.hero--home {
  --hero-title-size: var(--font-size-5xl);
  --hero-title-size-md: var(--font-size-6xl);
}
```

**Alternative: Data Attributes**

```html
<section class="hero" data-hero-size="large">
```

```css
.hero[data-hero-size="large"] {
  --hero-title-size: var(--font-size-5xl);
}
```

**Files to Modify:**
- [ ] `assets/css/components.css` - Refactor hero section styles

**Estimated Impact:**
- ~100-150 lines of CSS reduced
- Single responsive breakpoint definition
- Easier to add new page heroes

**Acceptance Criteria:**
- [ ] All hero sections render identically
- [ ] Responsive behavior preserved
- [ ] No visual regression on any page

---

## LOW PRIORITY

---

### Issue #7: Remove commented-out code and dead references

**Labels:** `cleanup`, `low-priority`, `tech-debt`

**Description:**

Several files contain commented-out code blocks and references to non-existent files. This adds noise and confusion.

**Instances Found:**

#### Extensive "FUTURE ENHANCEMENTS" Comments

**`assets/js/featured-release.js`** (lines 467-496):
```javascript
/*
  ============================================
  FUTURE ENHANCEMENTS
  ============================================

  Possible improvements to consider:

  1. CACHING:
     - Store fetched data in sessionStorage
     - Check cache before fetching
     ...
*/
```

**`assets/js/releases.js`** (lines 405-435):
Similar 30-line commented block.

**`assets/js/gallery.js`** (lines 750-754):
```javascript
// Check if we're on the Fan Club page (for future use)
// const isFanClubPage = window.location.pathname.includes('fanclub');
```

#### Dead File Reference

**`about.html`** (line 244):
```html
<!-- <script src="assets/js/progressive.js"></script> -->
```
This file (`progressive.js`) does not exist in the repository.

**Proposed Solution:**

Remove all commented-out code. Use git history to recover old code if needed. Future enhancements should be tracked in GitHub Issues, not code comments.

**Files to Modify:**
- [ ] `assets/js/featured-release.js` - Remove lines 467-496
- [ ] `assets/js/releases.js` - Remove lines 405-435
- [ ] `assets/js/gallery.js` - Remove lines 750-754
- [ ] `about.html` - Remove line 244

**Estimated Impact:**
- ~100+ lines of dead code removed
- Cleaner, more focused codebase
- Future enhancements tracked properly in Issues

**Acceptance Criteria:**
- [ ] No functional changes
- [ ] All commented code removed
- [ ] Future enhancement ideas captured in GitHub Issues if valuable

---

### Issue #8: Add lazy loading to static HTML images

**Labels:** `enhancement`, `performance`, `low-priority`

**Description:**

JavaScript-generated images correctly use `loading="lazy"`, but static `<img>` tags in HTML files do not.

**Current State:**

**Good (JS-generated):**
```javascript
// gallery.js line 253
img.loading = 'lazy';

// releases.js line 251
img.loading = 'lazy';
```

**Missing (static HTML):**
```html
<!-- Various HTML files -->
<img src="assets/images/logo.png" alt="...">
<img src="assets/images/kraken-album.png" alt="...">
```

**Files to Check:**
- [ ] `index.html` - Hero images, featured release
- [ ] `about.html` - Member photos, band images
- [ ] `contact.html` - Any decorative images
- [ ] `fanclub.html` - Member contact images

**Proposed Solution:**

Add `loading="lazy"` to all `<img>` tags except:
- Above-the-fold images (hero, logo) - these should load immediately
- Critical LCP (Largest Contentful Paint) images

```html
<!-- Below the fold - add lazy loading -->
<img src="assets/images/photo.jpg" alt="..." loading="lazy">

<!-- Above the fold - keep eager (default) -->
<img src="assets/images/hero.jpg" alt="...">
```

**Estimated Impact:**
- Faster initial page load
- Reduced bandwidth for users who don't scroll
- Better Core Web Vitals scores

**Acceptance Criteria:**
- [ ] All below-fold images have `loading="lazy"`
- [ ] Above-fold images load immediately
- [ ] No visual layout shift (images have width/height or aspect-ratio)

---

### Issue #9: Add debug flag for console logging

**Labels:** `enhancement`, `developer-experience`, `low-priority`

**Description:**

All JavaScript files contain verbose console.log statements with emoji prefixes for debugging:

```javascript
console.log('📡 Fetching gallery media...');
console.log('✅ Successfully loaded 8 media items');
console.log('❌ Error loading data:', error);
```

While helpful during development, these:
1. Increase bundle size
2. Expose internal workings to users
3. Clutter browser console in production

**Files Affected:**
- `assets/js/gallery.js`
- `assets/js/fanclub-gallery.js`
- `assets/js/featured-release.js`
- `assets/js/releases.js`
- `assets/js/announcements.js`
- `assets/js/fanclub-auth.js`
- `assets/js/message.js`

**Proposed Solution:**

Create a debug utility that can be toggled:

```javascript
// In utils.js
const DEBUG = false; // Set to true during development

export function debug(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

export function debugError(...args) {
  if (DEBUG) {
    console.error(...args);
  }
}
```

**Usage:**
```javascript
import { debug, debugError } from './utils.js';

debug('📡 Fetching gallery media...');
debugError('❌ Error:', error);
```

**Alternative: Environment-based**

```javascript
const DEBUG = window.location.hostname === 'localhost';
```

**Estimated Impact:**
- Cleaner production console
- ~50+ lines of logging can be conditionally disabled
- Better debugging experience with toggle

**Acceptance Criteria:**
- [ ] Debug flag implemented
- [ ] All console.log calls use debug utility
- [ ] Production site has clean console
- [ ] Development still shows helpful logs

---

### Issue #10: Implement WebP images with fallbacks

**Labels:** `enhancement`, `performance`, `images`, `future`

**Description:**

All images are served in PNG/JPG format. WebP provides 25-35% smaller file sizes with equivalent quality.

**Current Image Files:**
```
assets/images/
├── logo.png
├── kraken-album.png
├── basement-tapes-album.png
├── live-at-the-empty-room-album.png
├── the-whiskey-sessions-album.png
├── deadbeat-placeholder.svg
├── snowman-placeholder.svg
└── gallery/
    └── [various images]
```

**Proposed Solution:**

Use `<picture>` element with WebP and fallback:

```html
<picture>
  <source srcset="assets/images/kraken-album.webp" type="image/webp">
  <img src="assets/images/kraken-album.png" alt="Album cover" loading="lazy">
</picture>
```

**For JS-generated images:**

```javascript
function createPictureElement(basePath, alt) {
  const picture = document.createElement('picture');

  const webpSource = document.createElement('source');
  webpSource.srcset = basePath.replace(/\.(png|jpg)$/, '.webp');
  webpSource.type = 'image/webp';

  const img = document.createElement('img');
  img.src = basePath;
  img.alt = alt;
  img.loading = 'lazy';

  picture.appendChild(webpSource);
  picture.appendChild(img);

  return picture;
}
```

**Implementation Steps:**
1. Generate WebP versions of all images (can use tools like `cwebp` or online converters)
2. Update HTML to use `<picture>` elements
3. Update JS to generate `<picture>` elements
4. Keep original PNG/JPG as fallbacks

**Estimated Impact:**
- 25-35% reduction in image file sizes
- Faster page loads
- Better Core Web Vitals

**Acceptance Criteria:**
- [ ] WebP versions of all images created
- [ ] Fallback works in browsers without WebP support
- [ ] No visual quality loss
- [ ] File size reduction documented

---

### Issue #11: Add responsive images with srcset

**Labels:** `enhancement`, `performance`, `images`, `future`

**Description:**

Images are served at a single resolution regardless of viewport size. Mobile users download the same large images as desktop users.

**Current State:**
```html
<img src="assets/images/kraken-album.png" alt="...">
```

**Proposed Solution:**

Generate multiple image sizes and use `srcset`:

```html
<img
  src="assets/images/kraken-album-800.png"
  srcset="
    assets/images/kraken-album-400.png 400w,
    assets/images/kraken-album-800.png 800w,
    assets/images/kraken-album-1200.png 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  alt="Album cover"
  loading="lazy"
>
```

**Image Size Recommendations:**
- Album covers: 400px, 800px, 1200px
- Gallery thumbnails: 200px, 400px
- Gallery full-size: 800px, 1600px
- Hero images: 600px, 1200px, 2400px

**Tools for Generation:**
- `sharp` (Node.js)
- `ImageMagick`
- Cloudinary (if using CDN)
- Squoosh CLI

**Estimated Impact:**
- 50-70% bandwidth reduction on mobile
- Significantly faster mobile page loads
- Better Core Web Vitals (LCP improvement)

**Acceptance Criteria:**
- [ ] Multiple image sizes generated
- [ ] srcset implemented for key images
- [ ] sizes attribute matches CSS breakpoints
- [ ] No visual quality loss at any viewport

---

### Issue #12: Add CSS/JS minification for production

**Labels:** `enhancement`, `performance`, `build`, `future`

**Description:**

All CSS and JavaScript files are served unminified, increasing file sizes and page load times.

**Current File Sizes (unminified):**
- `components.css`: ~2,500 lines
- `layout.css`: ~200 lines
- `variables.css`: ~250 lines
- `reset.css`: ~100 lines
- Total CSS: ~3,050 lines

- `gallery.js`: ~790 lines
- `fanclub-gallery.js`: ~660 lines
- `releases.js`: ~440 lines
- `announcements.js`: ~400 lines
- Other JS: ~1,500 lines
- Total JS: ~3,800 lines

**Proposed Solutions:**

#### Option A: Build Script (Recommended)

Create a simple build script using Node.js:

```javascript
// build.js
const CleanCSS = require('clean-css');
const UglifyJS = require('uglify-js');
const fs = require('fs');

// Minify CSS
const cssFiles = ['reset.css', 'variables.css', 'layout.css', 'components.css'];
const cssContent = cssFiles.map(f => fs.readFileSync(`assets/css/${f}`, 'utf8')).join('\n');
const minifiedCSS = new CleanCSS().minify(cssContent);
fs.writeFileSync('assets/css/bundle.min.css', minifiedCSS.styles);

// Minify JS (per-file to maintain module structure)
// ...
```

#### Option B: GitHub Actions

Add minification step to deployment workflow:

```yaml
# .github/workflows/minify.yml
- name: Minify CSS
  run: npx clean-css-cli assets/css/*.css -o assets/css/bundle.min.css

- name: Minify JS
  run: npx uglify-js assets/js/*.js -o assets/js/bundle.min.js
```

#### Option C: CDN with Auto-Minification

Use Cloudflare's auto-minification feature (already using Cloudflare for DNS).

**Estimated Impact:**
- 40-60% reduction in CSS file size
- 30-50% reduction in JS file size
- Faster page loads (especially on slow connections)

**Acceptance Criteria:**
- [ ] Minified files generated
- [ ] Source maps available for debugging (optional)
- [ ] No functional changes
- [ ] Build process documented

---

## Summary

| Priority | Issues | Estimated Total Impact |
|----------|--------|----------------------|
| High | #1, #2, #3 | 2,000+ lines saved, major architecture improvement |
| Medium | #4, #5, #6 | 300+ lines saved, consistency improvements |
| Low | #7, #8, #9 | 150+ lines cleaned, minor performance gains |
| Future | #10, #11, #12 | 50%+ bandwidth reduction potential |

**Recommended Order:**
1. #2 (Utils module) - Foundation for other refactors
2. #1 (Lightbox module) - Largest single code reduction
3. #5 (JSON schemas) - Quick win, improves consistency
4. #7 (Dead code) - Quick cleanup
5. #4 (CSS utilities) - Incremental improvement
6. #3 (SSG evaluation) - Larger architectural decision
7. Remaining issues as capacity allows
