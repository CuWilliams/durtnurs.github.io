# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Static website for **tHE dURT nURS'**, a fictional rock band with gritty aesthetic and self-aware absurdist humor. Built with semantic HTML5, modern CSS (Grid & Flexbox), and vanilla JavaScript with progressive enhancement.

**Live Site:** https://www.durtnurs.com

**Current Status:** Production (Phase 10 complete)

---

## Tech Stack

- **Language:** HTML5, CSS3, JavaScript (ES6+)
- **Framework:** None (vanilla, no build tools)
- **Platform:** Static site hosted on GitHub Pages
- **Architecture:** Progressive enhancement, mobile-first responsive
- **CSS Methodology:** BEM (Block Element Modifier)

---

## Project Structure

```
durtnurs.github.io/
├── assets/
│   ├── css/
│   │   ├── reset.css          # Browser reset
│   │   ├── variables.css      # Design tokens (colors, typography, spacing)
│   │   ├── layout.css         # CSS Grid layouts, containers
│   │   └── components.css     # UI components (BEM classes)
│   ├── data/
│   │   ├── announcements.json # News data
│   │   ├── releases.json      # Album/discography data
│   │   └── gallery.json       # Media items (public/private flag)
│   ├── images/
│   │   └── gallery/           # Gallery images
│   └── js/
│       ├── announcements.js   # News page rendering
│       ├── releases.js        # Releases page rendering
│       ├── gallery.js         # Public gallery & lightbox
│       ├── fanclub-auth.js    # Access code authentication
│       ├── fanclub-gallery.js # Full gallery (all items)
│       ├── featured-release.js # Homepage featured release
│       └── message.js         # Humorous dead-end page
├── index.html                 # Homepage
├── about.html                 # Band bios
├── news.html                  # News archive
├── releases.html              # Discography
├── gallery.html               # Public photo/video gallery
├── contact.html               # Contact page
├── fanclub.html               # Protected area (code: KRAKEN)
├── privacy.html               # Satirical privacy policy
├── terms.html                 # Satirical terms of service
├── message.html               # Humorous redirect page
└── robots.txt                 # Search engine directives
```

CSS is loaded in order: reset → variables → layout → components

---

## Core Concepts

### Design Tokens
**File:** `assets/css/variables.css`

All design values are centralized as CSS custom properties:
- Colors: `--color-aged-whiskey`, `--color-coal-black`, `--color-tarnished-brass`, etc.
- Spacing: 8px base unit (`--space-xs` through `--space-4xl`)
- Typography: `--font-heading` (Oswald), `--font-body` (Merriweather)

### JSON Data Pattern
**Files:** `assets/data/*.json`

Content is managed via JSON files, rendered dynamically with JavaScript:
- `releases.json` - Set `"featured": true` for homepage display
- `gallery.json` - Set `"public": false` for Fan Club exclusive items
- `announcements.json` - Categories: `news`, `release`, `show`, `general`

### Progressive Enhancement
All pages work without JavaScript via `<noscript>` fallbacks. JavaScript enhances but is not required.

---

## Established Patterns

### 1. BEM CSS Naming

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

**Rule:** All component CSS uses BEM naming for maintainability.

### 2. Dynamic Content Rendering

**Pattern:**
```javascript
async function loadData() {
  const response = await fetch('assets/data/file.json');
  const data = await response.json();
  renderContent(data);
}
document.addEventListener('DOMContentLoaded', loadData);
```

**Examples:** `releases.js`, `announcements.js`, `gallery.js`

**Rule:** Always include error handling and loading states.

### 3. Fan Club Access Control

**File:** `assets/js/fanclub-auth.js`

Client-side gatekeeping (not secure, intentionally simple):
- Access code: `KRAKEN` (visible in source, by design)
- Uses `sessionStorage` for session persistence
- 3-attempt limit with humorous "drunk redirect"

**Documentation:** See `FANCLUB_ACCESS.md` for full details.

---

## Local Development

No build step required. Use any static file server:

```bash
# VS Code Live Server (recommended)
# Right-click index.html → Open with Live Server

# Python
python3 -m http.server 8000

# Node.js
npx serve
```

---

## Deployment

Automatic via GitHub Pages on push to `main`:

```bash
git add .
git commit -m "Description"
git push origin main
# Site updates in ~1-2 minutes
```

**Custom Domain:** durtnurs.com (DNS via Cloudflare, CNAME in repo)

---

## Content Management

### Change Featured Release
1. Edit `assets/data/releases.json`
2. Set `"featured": true` on desired release
3. Set `"featured": false` on previous featured release

### Add Announcement
1. Edit `assets/data/announcements.json`
2. Add object with: `id`, `date` (YYYY-MM-DD), `title`, `category`, `excerpt`, `content`
3. Optional: `link` object, `featured` boolean

### Add Fan Club Exclusive Media
1. Add image to `assets/images/gallery/`
2. Edit `assets/data/gallery.json`
3. Add object with `"public": false`

---

## Brand Guidelines

- **Tone:** Self-aware absurdism, dive bar authenticity, gruff humor
- **Colors:** Aged whiskey (#A05A24), coal black (#0B0B0C), tarnished brass (#8B7A43)
- **Fonts:** Oswald (headings), Merriweather (body)
- **Accessibility:** WCAG 2.1 AA compliance required

---

## Known Limitations

1. **Fan Club security is casual gatekeeping only** - Access code visible in source
2. **No server-side processing** - GitHub Pages static hosting only
3. **No database** - All content in JSON files
4. **Streaming links are placeholders** - Currently set to `#`

---

## Git Workflow

**Main Branch:** `main`

**Commit Style:** Descriptive, present tense ("Add feature" not "Added feature")

**Example Commit Messages:**
- `Update featured release to new album`
- `Add new gallery photos for Fan Club`
- `Fix mobile navigation alignment`
