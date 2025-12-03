# tHE dURT nURS' Official Website

Welcome to the official website repository for **tHE dURT nURS'**, a rock band combining gritty authentic rock aesthetic with self-aware absurdism.

**Live Site:** [https://www.durtnurs.com](https://www.durtnurs.com)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [File Structure](#file-structure)
- [Design System](#design-system)
- [Local Development](#local-development)
- [How to Update Content](#how-to-update-content)
- [Deployment](#deployment)
- [Technical Details](#technical-details)
- [Roadmap](#roadmap)

---

## 🎸 Project Overview

This is a static website built with semantic HTML5, modern CSS (Grid & Flexbox), and progressive enhancement principles. The site is optimized for performance, accessibility, and mobile-first responsive design.

### Design Philosophy
- **Aesthetic:** Gritty authentic rock with aged whiskey, brass, and coal-black tones
- **Tone:** Self-aware absurdism meets dive bar authenticity
- **UX:** Fast, accessible, works without JavaScript

### Current Status: Phase 5 Complete ✅
- ✅ Foundation & homepage
- ✅ About page with band bios
- ✅ News/announcements system with JSON data
- ✅ Releases/discography page with album grid
- ✅ Gallery page with photo/video lightbox
- ✅ Contact page with mailto integration
- ✅ Dynamic content loading with JavaScript
- ✅ Custom lightbox implementation (no external libraries)
- ✅ Progressive enhancement (works without JS)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Semantic HTML5 with ARIA labels
- ✅ CSS architecture (BEM methodology)
- ✅ Mobile-first CSS Grid layout
- ✅ CSS-only navigation menu
- ✅ Member profile cards
- ✅ Album/release cards with collapsible tracklists
- ✅ Gallery grid with lightbox functionality
- ✅ Keyboard navigation support (ESC, arrow keys)

---

## 📁 File Structure

```
durtnurs.github.io/
├── index.html                 # Main homepage
├── about.html                 # Band bio and member profiles
├── news.html                  # News archive page (Phase 3)
├── releases.html              # Releases/discography page (Phase 4)
├── gallery.html               # Photo/video gallery (NEW - Phase 5)
├── contact.html               # Contact page (NEW - Phase 5)
├── assets/
│   ├── css/
│   │   ├── reset.css          # Modern CSS reset
│   │   ├── variables.css      # Design tokens
│   │   ├── layout.css         # CSS Grid layouts
│   │   └── components.css     # UI components (updated with gallery & contact)
│   ├── data/
│   │   ├── announcements.json # News data (Phase 3)
│   │   ├── releases.json      # Album/release data (Phase 4)
│   │   └── gallery.json       # Gallery media data (NEW - Phase 5)
│   ├── images/
│   │   ├── logo.png           # Band logo
│   │   ├── kraken-album.png   # Album artwork
│   │   ├── deadbeat-placeholder.svg   # DeadBeat member photo
│   │   ├── snowman-placeholder.svg    # SnowMan member photo
│   │   └── gallery/           # Gallery images directory (NEW - Phase 5)
│   │       └── README.md      # Gallery image guidelines
│   └── js/
│       ├── announcements.js   # Dynamic news loading (Phase 3)
│       ├── releases.js        # Dynamic release loading (Phase 4)
│       └── gallery.js         # Gallery & lightbox (NEW - Phase 5)
├── README.md                  # This file
├── CNAME                      # Custom domain configuration
└── .gitignore                 # Git exclusions
```

### CSS Architecture

The CSS is split into four logical layers (loaded in order):

1. **reset.css** - Remove browser defaults, set sensible foundations
2. **variables.css** - Design tokens (colors, typography, spacing)
3. **layout.css** - Page structure (CSS Grid, containers, sections)
4. **components.css** - UI components (navigation, buttons, cards)

**Why separate files?**
- Easier to maintain and debug
- Clear separation of concerns
- Can be minified/concatenated for production

---

## 🎨 Design System

### Color Palette

| Color Name         | Hex Code  | Usage                        |
|--------------------|-----------|------------------------------|
| Aged Whiskey       | `#A05A24` | Primary brand color          |
| Burnt Umber        | `#5A3A27` | Dark backgrounds, surfaces   |
| Coal Black         | `#0B0B0C` | Main background              |
| Dried Blood Red    | `#5B1A1A` | Accent/danger states         |
| Iron Gray          | `#3A3F45` | Borders, muted text          |
| Tarnished Brass    | `#8B7A43` | Links, metallic accents      |

**Accessibility:** All text/background combinations meet WCAG 2.1 AA contrast ratios (4.5:1 minimum).

### Typography

- **Headings:** [Oswald](https://fonts.google.com/specimen/Oswald) (Bold, condensed, rock poster vibe)
- **Body Text:** [Merriweather](https://fonts.google.com/specimen/Merriweather) (Readable serif, slightly weathered)
- **Base Size:** 16px (1rem)
- **Scale:** Responsive sizing via CSS variables (mobile → desktop)

### Spacing System

All spacing uses an **8px base unit** for visual consistency:

```css
--space-xs: 0.5rem;   /* 8px  */
--space-sm: 1rem;     /* 16px */
--space-md: 1.5rem;   /* 24px */
--space-lg: 2rem;     /* 32px */
--space-xl: 3rem;     /* 48px */
--space-2xl: 4rem;    /* 64px */
```

---

## 💻 Local Development

### Option 1: VS Code Live Server (Recommended)

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Open the project folder in VS Code
3. Right-click `index.html` → **Open with Live Server**
4. Site opens at `http://localhost:5500` with auto-reload

### Option 2: Python Simple HTTP Server

```bash
# Python 3.x
cd /path/to/durtnurs.github.io
python3 -m http.server 8000

# Open browser to http://localhost:8000
```

### Option 3: Any Static Server

Any static file server works since this is plain HTML/CSS:
- Node.js: `npx serve`
- PHP: `php -S localhost:8000`
- nginx, Apache, etc.

---

## ✏️ How to Update Content

### Update News/Announcements (Phase 3)

**NEW:** News is now managed via JSON for easy updates!

1. Open `assets/data/announcements.json`
2. Add a new announcement object to the `announcements` array:
   ```json
   {
     "id": "007",
     "date": "2024-12-05",
     "title": "Your Announcement Title",
     "category": "news",
     "excerpt": "Brief summary (120 characters max)",
     "content": "<p>Full announcement content with HTML tags.</p>",
     "link": {
       "url": "https://example.com",
       "text": "Optional Link Text"
     },
     "featured": false
   }
   ```
3. **Required fields:** id, date (ISO format: YYYY-MM-DD), title, category, excerpt, content
4. **Optional fields:** link (object with url and text), featured (boolean)
5. **Category options:** `news`, `release`, `show`, `general`
6. Keep announcements in reverse chronological order (newest first)
7. Save and commit - changes appear immediately on the site!

**Tips:**
- Keep excerpts under 120 characters
- Content supports HTML: `<p>`, `<strong>`, `<em>`, `<a>`
- Set `featured: true` for important announcements (adds star icon)

### Update Releases/Discography (Phase 4)

**NEW:** Releases are now managed via JSON for easy updates!

1. Open `assets/data/releases.json`
2. Add a new release object to the `releases` array:
   ```json
   {
     "id": "release-your-album-2025",
     "title": "Your Album Title",
     "artist": "tHE dURT nURS'",
     "releaseDate": "2025-01-15",
     "type": "album",
     "coverArt": "assets/images/your-album-cover.png",
     "coverArtAlt": "Description of album cover for screen readers",
     "description": "Brief album description with the band's humor",
     "tracklist": [
       "Track 1 Name",
       "Track 2 Name",
       "Track 3 Name"
     ],
     "streamingLinks": {
       "spotify": "https://spotify.com/your-link",
       "apple": "https://music.apple.com/your-link",
       "bandcamp": "https://bandcamp.com/your-link"
     },
     "featured": false
   }
   ```
3. **Required fields:** id, title, artist, releaseDate (ISO format: YYYY-MM-DD), type, coverArt, coverArtAlt, description
4. **Optional fields:** tracklist (array), streamingLinks (object), featured (boolean)
5. **Type options:** `album`, `ep`, `single`, `live`, `compilation`
6. Use `#` for streaming links that aren't ready yet (they won't display)
7. Set `featured: true` for your newest/primary release (gets special styling)
8. Keep releases in reverse chronological order (newest first) for best organization
9. Add album cover image to `assets/images/` folder
10. Save and commit - changes appear immediately on the site!

**Tips:**
- Album covers should be square (1:1 ratio), at least 600x600px
- Use descriptive alt text for accessibility
- Featured releases span 2 columns on desktop and have prominent styling
- Type badges are color-coded automatically based on release type
- Tracklists are collapsible - no JavaScript required!

### Change Colors

1. Open `assets/css/variables.css`
2. Edit the `:root` color variables (lines 13-26)
3. Changes apply site-wide automatically

### Update Album Info

1. Open `index.html`
2. Find `<section class="featured-section">`
3. Edit the `.album-card` content:
   - Album title
   - Release date
   - Description
4. Replace album artwork:
   - Add new image to `assets/images/`
   - Update `<img src="assets/images/your-image.png">`

### Swap Placeholder Images

1. Replace `assets/images/logo.png` with your actual logo
2. Replace `assets/images/kraken-album.png` with actual album art
3. Keep file names the same, or update references in `index.html`

**Image recommendations:**
- Logo: PNG with transparent background, ~500px wide
- Album cover: Square (1:1 ratio), at least 600x600px
- Use compression ([TinyPNG](https://tinypng.com/)) for faster loading

### Update Member Bios

1. Open `about.html`
2. Find the `<section class="band-members">` block
3. Locate the member you want to update (DeadBeat or SnowMan)
4. Edit the `.member-bio` content within that member's card:
```html
   <div class="member-bio">
     <p>Add your bio paragraphs here...</p>
     <p>You can add multiple paragraphs...</p>
   </div>
```
5. To replace placeholder images:
   - Add new images to `assets/images/`
   - Update the `<img src="">` path in the member card
   - Recommended: Square images (400x400px minimum)

### Update Origin Story

1. Open `about.html`
2. Find `<section class="origin-story">`
3. Replace the `.origin-placeholder` paragraph with your actual story
4. Remove or update the `.note` paragraph

---

## 🚀 Deployment

### GitHub Pages Setup

This site is hosted via GitHub Pages:

1. **Repository Settings:**
   - Go to Settings → Pages
   - Source: Deploy from `main` branch
   - Folder: `/ (root)`

2. **Custom Domain (Cloudflare):**
   - Domain registered via GoDaddy: `durtnurs.com`
   - DNS managed via Cloudflare
   - CNAME record: `durtnurs.com` → `cuwilliams.github.io`
   - `CNAME` file in repo root contains: `durtnurs.com`

3. **SSL/HTTPS:**
   - Enforced via Cloudflare (Full SSL mode)
   - GitHub Pages also provides HTTPS

### Deployment Workflow

Changes pushed to `main` branch are automatically deployed:

```bash
# Make changes locally
git add .
git commit -m "Update news section"
git push origin main

# Site updates in ~1-2 minutes
```

---

## 🛠️ Technical Details

### Browser Support
- Last 2 versions: Chrome, Firefox, Safari, Edge
- iOS Safari 12+
- Android Chrome 80+

### Performance
- Target: <2 seconds load time on 3G
- Optimizations:
  - Minimal CSS (no frameworks)
  - Inline critical CSS (future optimization)
  - SVG placeholders (lightweight)
  - System font fallbacks

### Accessibility (WCAG 2.1 AA)
- ✅ Semantic HTML5 elements
- ✅ ARIA labels for navigation
- ✅ Keyboard navigation support
- ✅ Sufficient color contrast
- ✅ Focus visible states
- ✅ Screen reader friendly

### CSS Methodology: BEM

This project uses **BEM (Block Element Modifier)** naming:

```css
.block { }                  /* Component */
.block__element { }         /* Part of component */
.block__element--modifier { }  /* Variant */
```

**Example:**
```css
.news-card { }              /* Block */
.news-card__title { }       /* Element */
.news-card__title--featured { }  /* Modifier */
```

### Mobile Menu: CSS-Only

The navigation uses a checkbox hack (no JavaScript required):

1. Hidden checkbox: `<input id="nav-toggle">`
2. Label acts as button: `<label for="nav-toggle">`
3. CSS `:checked` pseudo-class toggles menu visibility
4. Hamburger animates to X using CSS transforms

---

## 🗺️ Roadmap

### Phase 1 Complete ✅
- [✅] Foundation & homepage
- [✅] CSS architecture (BEM, variables, grid)
- [✅] Mobile-first responsive design
- [✅] CSS-only navigation

### Phase 2 Complete ✅
- [✅] About page with band bio
- [✅] Member profile cards (DeadBeat, SnowMan)
- [✅] Origin story placeholder

### Phase 3 Complete ✅
**Note:** Originally planned as Phase 5, moved forward to establish content architecture early.

- [✅] JSON data structure for announcements
- [✅] JavaScript module for dynamic rendering
- [✅] News archive page (news.html)
- [✅] Dynamic homepage news loading
- [✅] Progressive enhancement fallback
- [✅] Category-based styling system

### Phase 4 Complete ✅
**Completed:** December 3, 2024

- [✅] Releases page (discography/albums)
- [✅] JSON data structure for album/release information (`releases.json`)
- [✅] JavaScript module for dynamic release rendering (`releases.js`)
- [✅] Album card components with BEM methodology
- [✅] Responsive album grid (1-3 columns based on viewport)
- [✅] Featured release highlighting (spans 2 columns on desktop)
- [✅] Collapsible tracklists using native `<details>` element
- [✅] Type-specific badges (album, EP, single, live, compilation)
- [✅] Streaming service links (placeholder structure ready)
- [✅] Progressive enhancement with static fallback
- [✅] Navigation updated across all pages

**Features:**
- Scalable album grid layout with CSS Grid
- JSON-based data structure for easy content management
- Dynamic rendering via JavaScript with comprehensive error handling
- Progressive enhancement (works without JavaScript)
- Responsive design (mobile: 1 column, tablet: 2 columns, desktop: 3 columns)
- Featured releases span 2 columns on desktop with horizontal layout
- Collapsible tracklists (no JavaScript required - native HTML)
- Type-specific color coding for different release types
- Hover effects with smooth transitions
- Semantic HTML5 with proper ARIA labels
- Educational inline comments throughout codebase

### Phase 5 Complete ✅
**Completed:** December 3, 2024

- [✅] Gallery page with responsive photo/video grid
- [✅] JSON data structure for gallery media (`gallery.json`)
- [✅] JavaScript module for dynamic gallery rendering (`gallery.js`)
- [✅] Custom lightbox implementation (no external libraries)
- [✅] Keyboard navigation (ESC to close, arrow keys for prev/next)
- [✅] Click-outside-to-close functionality
- [✅] Contact page with mailto integration
- [✅] Zoho email integration (biteme@durtnurs.com)
- [✅] Band's characteristic humor in contact messaging
- [✅] Progressive enhancement with static fallback
- [✅] Navigation updated across all pages
- [✅] Public/private flag system for Phase 6 Fan Club preparation
- [✅] Gallery images directory structure
- [✅] Responsive grid (1-4 columns based on viewport)
- [✅] Video embed support in lightbox
- [✅] Play icon overlay for video thumbnails
- [✅] Image counter in lightbox (e.g., "3 / 8")

**Features:**
- **Gallery Page:**
  - Responsive CSS Grid layout (mobile: 1 column, tablet: 2, desktop: 3, large: 4)
  - JSON-based data structure with public/private filtering
  - Custom lightbox with full-size image/video viewing
  - Keyboard navigation (ESC, Left Arrow, Right Arrow)
  - Previous/Next buttons in lightbox
  - Click outside lightbox to close
  - Image counter showing position (e.g., "3 / 8")
  - Video embeds (YouTube) with play icon overlay
  - Featured media highlighting
  - Progressive enhancement (works without JavaScript)
  - Loading states and error handling

- **Contact Page:**
  - Prominent mailto: button (biteme@durtnurs.com)
  - Band's characteristic gruff humor
  - Multiple contact context categories
  - Social media integration
  - Humorous spam warning section
  - Fully responsive design
  - Accessible keyboard navigation

- **Technical:**
  - No external JavaScript libraries (lightbox built from scratch)
  - Event delegation for performance
  - Focus management (trapped in lightbox when open)
  - Body scroll prevention when lightbox is open
  - Semantic HTML5 with proper ARIA labels
  - Comprehensive error handling
  - Educational inline comments throughout
  - Mobile-first responsive design

### Phase 6
- [ ] Mailing list integration
- [ ] Merch store

### Future Enhancements
- [ ] Category filtering on news archive
- [ ] Dark/light mode toggle
- [ ] Lazy loading images
- [ ] Service worker (offline support)
- [ ] Animations (Intersection Observer)

---

## 📝 Notes for Developers

### Code Quality Standards
- ✅ HTML validates ([W3C Validator](https://validator.w3.org/))
- ✅ CSS validates ([CSS Validator](https://jigsaw.w3.org/css-validator/))
- ✅ 2-space indentation
- ✅ BEM naming convention
- ✅ Comments explain "why" not "what"

### Learning Resources

If you're new to these technologies:

- **CSS Grid:** [CSS Tricks Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- **Flexbox:** [CSS Tricks Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- **BEM Methodology:** [BEM Documentation](https://en.bem.info/methodology/)
- **Accessibility:** [WebAIM Resources](https://webaim.org/resources/)

### Testing Checklist

Before deploying major changes:

- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile device (real or DevTools)
- [ ] Check all breakpoints (mobile, tablet, desktop)
- [ ] Validate HTML/CSS
- [ ] Test keyboard navigation (Tab key)
- [ ] Check color contrast ratios
- [ ] Run Lighthouse audit in Chrome DevTools

---

## 🤘 Contributing

This is a personal band website, but if you spot bugs or have suggestions:

1. Open an issue on GitHub
2. Or email: [deadbeat@durtnurs.com](mailto:deadbeat@durtnurs.com)

---

## 📄 License

© 2024 tHE dURT nURS'. All rights reserved.

Built with grit, aged whiskey, and questionable decisions.

**Release the Kraken!** 🐙
