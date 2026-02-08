# Build Commands Reference

Quick reference for npm scripts in this project.

## Daily Development

```bash
npm run serve           # Start dev server at localhost:8080 (hot reload)
```

## Production Build

```bash
npm run build           # Full production build (11ty + minification)
```

## When Adding New Images

```bash
npm run optimize-images # Generate WebP versions of new images
npm run build           # Then build as usual
```

## When Adding/Removing Hero Animation Images

```bash
# 1. Add or remove PNGs in your source folder
# 2. Run prepare-hero (resizes to 200px, renames, generates manifest)
npm run prepare-hero                              # Default source: ~/Desktop/kaleidoscope-images/
npm run prepare-hero -- --source /path/to/folder  # Custom source folder
# 3. Generate WebP versions
npm run optimize-images
# 4. Build as usual
npm run build
```

Images must be PNGs (transparency recommended). The script resizes to max 200px, renames to `hero-obj-01.png` etc., and regenerates `assets/data/hero-objects.json`.

## Individual Scripts

| Command | What it does |
|---------|--------------|
| `npm run serve` | Dev server with hot reload |
| `npm run build` | Production build (11ty + minify CSS/JS) |
| `npm run build:dev` | 11ty only (faster, no minification) |
| `npm run minify` | Minify CSS/JS in existing `_site/` |
| `npm run optimize-images` | Generate WebP from PNG/JPG images |
| `npm run prepare-hero` | Resize hero animation PNGs and generate manifest |

## Workflow Examples

### Making code changes
```bash
npm run serve    # Work with hot reload
# ... make changes ...
git add . && git commit -m "Description"
git push         # GitHub Actions runs npm run build
```

### Adding new images
```bash
# Add images to assets/images/
npm run optimize-images   # Creates .webp versions
git add .
git commit -m "Add new images"
git push
```

### Testing production build locally
```bash
npm run build
# Open _site/index.html or:
python3 -m http.server 8000 -d _site
```
