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

## Individual Scripts

| Command | What it does |
|---------|--------------|
| `npm run serve` | Dev server with hot reload |
| `npm run build` | Production build (11ty + minify CSS/JS) |
| `npm run build:dev` | 11ty only (faster, no minification) |
| `npm run minify` | Minify CSS/JS in existing `_site/` |
| `npm run optimize-images` | Generate WebP from PNG/JPG images |

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
