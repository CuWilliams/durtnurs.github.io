# tHE dURT nURS' Official Website

This repository contains the source code for the official website of **tHE dURT nURS'** — a rock band based in NL, Canada.

The site is live at:
**https://www.durtnurs.com**

---

## About

This website includes (or will eventually include!):

- Band bio and background
- Upcoming gigs and events
- Music, video, and photo galleries
- Contact and booking information
- Links to social media and streaming platforms

---

### Current Status: Phase 2 Complete ✅
- ✅ Foundation & homepage
- ✅ About page with band bios
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Semantic HTML5 with ARIA labels
- ✅ CSS architecture (BEM methodology)
- ✅ Mobile-first CSS Grid layout
- ✅ CSS-only navigation menu
- ✅ Member profile cards with expansion capability

---

## Tech Stack

- **HTML / CSS / JavaScript**
- Hosted via **GitHub Pages**
- Domain managed with **Cloudflare**
- Registered via **GoDaddy**

---

## 📁 File Structure

```
durtnurs.github.io/
├── index.html                 # Main homepage
├── about.html                 # Band bio and member profiles (NEW)
├── assets/
│   ├── css/
│   │   ├── reset.css          # Modern CSS reset
│   │   ├── variables.css      # Design tokens
│   │   ├── layout.css         # CSS Grid layouts
│   │   └── components.css     # UI components (updated with member cards)
│   ├── images/
│   │   ├── logo.png           # Band logo
│   │   ├── kraken-album.png   # Album artwork
│   │   ├── deadbeat-placeholder.png   # DeadBeat member photo (NEW)
│   │   └── snowman-placeholder.png    # SnowMan member photo (NEW)
│   └── js/
│       └── progressive.js     # (Future) Optional enhancements
├── README.md                  # This file
├── CNAME                      # Custom domain configuration
└── .gitignore                 # Git exclusions
```

---

## Repository Naming

This repo was renamed from `CuWilliams.github.io` to `durtnurs.github.io` to better reflect its purpose and make it easier to manage alongside other projects.

---

## DNS + Hosting Notes

- Domain: `durtnurs.com`
- DNS: Managed via Cloudflare
- GitHub Pages still uses `CuWilliams.github.io` as the CNAME target
- Custom domain is configured using a `CNAME` file in the repo root

---

## Contributing & Updating

To update the site:

1. Clone the repo:
   ```bash
   git clone https://github.com/CuWilliams/durtnurs.github.io.git
   cd durtnurs.github.io
   ```

2. Make your changes to the HTML/CSS files

3. Test locally by opening `index.html` in a browser

4. Commit and push:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

---

### How to Update Content

1. Open the HTML file you want to edit (e.g., `index.html`, `about.html`)
2. Find the section you want to update
3. Edit the content directly in the HTML
4. Save the file
5. Commit and push your changes

---

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

## 🗺️ Roadmap

### Phase 2 Complete ✅
- [✅] About page with band bio
- [✅] Member profile cards (DeadBeat, SnowMan)
- [✅] Origin story placeholder

### Phase 3 (Next)
- [ ] Releases page (discography/albums)
- [ ] Album card components
- [ ] Responsive album grid

### Phase 4 (Future)
- [ ] Shows/Events page
- [ ] Photo/video gallery
- [ ] Contact form
- [ ] Social media integration

---

## License

All content © tHE dURT nURS'. All rights reserved.
