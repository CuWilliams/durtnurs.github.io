# tHE dURT nURS' Website - Development Guide

**Static website for a fictional rock band with gritty aesthetic and self-aware absurdist humor.**

---

## Project Overview

Website for **tHE dURT nURS'**, featuring band info, discography, news, gallery, and a password-protected Fan Club area. Built with semantic HTML5, modern CSS, and vanilla JavaScript with progressive enhancement.

**Live Site:** https://www.durtnurs.com

**Current Status:** Production (Phase 10 complete + 11ty templating)

---

## Tech Stack

- **Language:** HTML5, CSS3, JavaScript (ES6+)
- **Static Site Generator:** 11ty (Eleventy) v3.x
- **Templating:** Nunjucks (.njk files)
- **Platform:** GitHub Pages with GitHub Actions build
- **Architecture:** Progressive enhancement, mobile-first responsive
- **CSS Methodology:** BEM (Block Element Modifier)

---

## Project Structure

```
durtnurs.github.io/
├── src/                       # Source files (11ty input)
│   ├── _includes/             # Shared partials
│   │   ├── head.njk           # <head> content (meta, CSS, fonts)
│   │   ├── header.njk         # Site header and navigation
│   │   └── footer.njk         # Site footer
│   ├── _layouts/              # Page templates
│   │   ├── base.njk           # Standard page layout
│   │   ├── base-fanclub.njk   # Fan Club (no main wrapper)
│   │   ├── base-legal.njk     # Privacy/Terms pages
│   │   └── base-message.njk   # Message page (minimal)
│   └── *.njk                  # Page content files
├── assets/                    # Static assets (copied unchanged)
│   ├── css/                   # Stylesheets (reset → variables → layout → components)
│   ├── data/                  # JSON content files
│   ├── images/                # Images and gallery photos
│   └── js/                    # JavaScript modules
├── scripts/                   # Build scripts (minification, etc.)
├── _site/                     # Build output (gitignored)
├── .github/workflows/         # GitHub Actions for build/deploy
├── .eleventy.js               # 11ty configuration
└── package.json               # npm scripts and dependencies
```

---

## Core Concepts

### 11ty Templating

**Config:** `.eleventy.js`

Pages use Nunjucks templates with front matter:
```yaml
---
layout: base.njk
title: Page Title
description: Meta description
activePage: about
scripts:
  - releases.js
---
```

**Key Variables:**
- `title` - Page title (used in `<title>` and Open Graph)
- `description` - Meta description
- `activePage` - Highlights current nav link (home, about, news, etc.)
- `scripts` - Array of JS files to load (without utils.js, which is always included)

### Design Tokens

**File:** `assets/css/variables.css`

All design values as CSS custom properties:
- Colors: `--color-aged-whiskey`, `--color-coal-black`, `--color-tarnished-brass`
- Spacing: 8px base unit (`--space-xs` through `--space-4xl`)
- Typography: `--font-heading` (Oswald), `--font-body` (Merriweather)

### JSON Data Pattern

**Files:** `assets/data/*.json`

**Schema Documentation:** See `docs/DATA_SCHEMA.md` for full field reference.

Content managed via JSON, rendered dynamically:
- `releases.json` - Set `"featured": true` for homepage
- `gallery.json` - Set `"public": false` for Fan Club exclusive
- `announcements.json` - Categories: `news`, `release`, `show`, `general`

**Key conventions:**
- Dates: ISO 8601 format (`YYYY-MM-DD`) with leading zeros
- IDs: kebab-case with optional type prefix (`release-kraken-2024`)
- Placeholders: Use `"#"` for inactive URLs

### Progressive Enhancement

All pages work without JavaScript via `<noscript>` fallbacks.

---

## Established Patterns

### 1. Shared Utilities Module

**File:** `assets/js/utils.js`

Centralized helper functions used across all JS files:

```javascript
// Available as DurtNursUtils namespace
DurtNursUtils.formatDate(isoString)      // Returns "Month DD, YYYY"
DurtNursUtils.fetchJSON(path)            // Fetch with error handling
DurtNursUtils.displayError(container, message)  // Show error UI
DurtNursUtils.onDOMReady(callback)       // Cross-browser DOM ready
```

**Rule:** Import utils.js before any page-specific JS. Use namespace to avoid conflicts.

### 2. Shared Lightbox Module

**File:** `assets/js/lightbox.js`

Reusable modal for photos/videos:

```javascript
// Available as DurtNursLightbox namespace
DurtNursLightbox.init(containerSelector)  // Initialize for a gallery
DurtNursLightbox.open(index)              // Open at specific index
DurtNursLightbox.close()                  // Close modal
```

**Features:** Keyboard nav (ESC, arrows), click-outside-to-close, ARIA labels

**Rule:** Used by both `gallery.js` and `fanclub-gallery.js`.

### 3. BEM CSS Naming

**Pattern:**
```css
.block { }
.block__element { }
.block--modifier { }

/* Example */
.news-card { }
.news-card__title { }
.news-card__title--featured { }
```

### 4. Fan Club Access Control

**File:** `assets/js/fanclub-auth.js`

Client-side gatekeeping (casual security by design):
- Access code: `ECCLESIASTICS`
- Uses `sessionStorage` for session persistence
- 3-attempt limit with humorous "drunk redirect"

**Documentation:** See `docs/FANCLUB_ACCESS.md`

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Commands

```bash
npm install          # Install dependencies (first time only)
npm run serve        # Dev server with hot reload at localhost:8080
npm run build        # Production build (11ty + CSS/JS minification)
npm run build:dev    # Development build (11ty only, faster)
npm run minify       # Run minification on existing _site/ output
npm run optimize-images  # Generate WebP versions of all images
```

### Alternative (Direct Access)

For quick edits without build:
```bash
python3 -m http.server 8000 -d _site
```

---

## Deployment

Automatic via GitHub Actions on push to `main`:

```bash
git add .
git commit -m "Description"
git push origin main
# GitHub Actions builds and deploys (~30 seconds)
```

**GitHub Pages:** Source set to "GitHub Actions"
**Custom Domain:** durtnurs.com (DNS via Cloudflare)

---

## Content Management

### Change Featured Release
1. Edit `assets/data/releases.json`
2. Set `"featured": true` on desired release
3. Set `"featured": false` on previous

### Add Announcement
1. Edit `assets/data/announcements.json`
2. Add object: `id`, `date`, `title`, `category`, `excerpt`, `content`
3. Optional: `link` object, `featured` boolean

### Add Gallery Media
1. Add image to `assets/images/gallery/`
2. Edit `assets/data/gallery.json`
3. Set `"public": false` for Fan Club exclusive

### Add/Edit Page
1. Edit `src/[page].njk`
2. Update front matter as needed
3. Run `npm run build` to verify

---

## Brand Guidelines

- **Tone:** Self-aware absurdism, dive bar authenticity, gruff humor
- **Colors:** Aged whiskey (#A05A24), coal black (#0B0B0C), tarnished brass (#8B7A43)
- **Fonts:** Oswald (headings), Merriweather (body)
- **Accessibility:** WCAG 2.1 AA compliance required

---

## Known Limitations

1. **Fan Club is casual gatekeeping** - Access code visible in source (intentional)
2. **No server-side processing** - Static hosting only
3. **No database** - All content in JSON files
4. **Streaming links are placeholders** - Currently link to message page

---

## Git Workflow

**Main Branch:** `main`

**Commit Style:** Descriptive present tense

**Examples:**
- `Add new gallery photos for Fan Club`
- `Update featured release to new album`
- `Fix mobile navigation alignment`

---

## Reference Documentation

- **Fan Club Access:** `docs/FANCLUB_ACCESS.md`
- **JSON Data Schemas:** `docs/DATA_SCHEMA.md`
- **Template Guide:** `docs/CLAUDE_MD_TEMPLATE.md`

---

*Maintained for Claude Code sessions. Last updated: January 2026*
