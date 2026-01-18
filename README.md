# tHE dURT nURS'

**Gritty authentic rock with self-aware absurdism.**

The official website for tHE dURT nURS' — a rock band that takes the music seriously, but absolutely nothing else.

**Live Site:** [durtnurs.com](https://www.durtnurs.com)

---

## About the Band

tHE dURT nURS' consists of two members who met at a dive bar and decided the world needed more songs about whiskey, regret, and mythological sea creatures. The website reflects this ethos: weathered aesthetics, gruff humor, and the kind of warmth you only find at 2 AM in a bar that definitely fails health inspections.

**Motto:** *Release the Kraken!*

---

## The Aesthetic

### Design Philosophy

- **Visual Identity:** Aged whiskey, tarnished brass, coal-black nights
- **Tone:** Dive bar authenticity meets absurdist self-awareness
- **Experience:** Fast, accessible, works even if JavaScript decides to take a smoke break

### Color Palette

| Color            | Hex       | Vibe                          |
|------------------|-----------|-------------------------------|
| Aged Whiskey     | `#A05A24` | Like good bourbon — warm, inviting, potentially dangerous |
| Tarnished Brass  | `#8B7A43` | The color of glory days and unpaid tabs |
| Coal Black       | `#0B0B0C` | The void stares back, but it's playing bass |
| Dried Blood Red  | `#5B1A1A` | For when things get... interesting |
| Iron Gray        | `#3A3F45` | The morning after |

### Typography

- **Headings:** [Oswald](https://fonts.google.com/specimen/Oswald) — bold, condensed, looks good on a gig poster
- **Body:** [Merriweather](https://fonts.google.com/specimen/Merriweather) — readable, slightly weathered, like us

---

## Features

- **Band Info** — Member profiles, origin story (it involves whiskey)
- **News** — Announcements, filtered by how much we've had to drink
- **Releases** — Full discography with collapsible tracklists
- **Gallery** — Photos and videos of questionable quality and excellent memories
- **Fan Club** — Password-protected area for our closest friends (access code may or may not be hidden in plain sight)
- **Contact** — Email us at `biteme@durtnurs.com` (yes, really)

---

## Tech Stack

Built with the fundamentals, no frameworks required:

- **HTML5** — Semantic, accessible, actually validates
- **CSS3** — Grid, Flexbox, BEM methodology, 8px spacing system
- **JavaScript** — Vanilla ES6+, progressive enhancement
- **11ty (Eleventy)** — Static site generator for templating
- **GitHub Pages** — Hosting via GitHub Actions

### Why No Framework?

Because sometimes you don't need React to tell people about your band. Also, it's more fun this way.

---

## Development

### Prerequisites

- Node.js 18+
- A healthy appreciation for dive bars (optional but encouraged)

### Quick Start

```bash
npm install        # Install dependencies
npm run serve      # Start dev server at localhost:8080
npm run build      # Build to _site/
```

### Project Structure

```
durtnurs.github.io/
├── src/                   # Source templates (Nunjucks)
│   ├── _includes/         # Shared partials (head, header, footer)
│   ├── _layouts/          # Page layouts
│   └── *.njk              # Page content
├── assets/                # Static files
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   ├── data/              # JSON content files
│   └── images/            # Band photos, album art
├── _site/                 # Build output (gitignored)
└── .github/workflows/     # Automated deployment
```

---

## Content Management

All content lives in JSON files. No database, no CMS, no problem.

- **News:** `assets/data/announcements.json`
- **Releases:** `assets/data/releases.json`
- **Gallery:** `assets/data/gallery.json`

To update the featured release on the homepage, just flip `"featured": true` in `releases.json`.

---

## Deployment

Push to `main`. GitHub Actions handles the rest. Site updates in ~30 seconds.

```bash
git add .
git commit -m "Add new questionable content"
git push origin main
```

---

## Accessibility

We take accessibility seriously (unlike most other things):

- WCAG 2.1 AA compliant
- Semantic HTML5 with ARIA labels
- Keyboard navigation throughout
- Works without JavaScript
- Proper color contrast ratios

---

## Contributing

This is a personal band site, but if you spot bugs:

1. Open an issue
2. Or email [deadbeat@durtnurs.com](mailto:deadbeat@durtnurs.com)
3. Or don't. We're not your boss.

---

## License

© 2024-2025 tHE dURT nURS'. All rights reserved.

Built with grit, aged whiskey, and questionable decisions.

**Release the Kraken!**
