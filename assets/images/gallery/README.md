# Gallery Images Directory

This directory contains all photo and video thumbnail images for the dURT nURS' gallery.

## Directory Structure

All gallery images should be placed in this directory following these naming conventions:

- **Full-size images:** `[id].jpg` (example: `photo-001.jpg`)
- **Thumbnails:** `[id]-thumb.jpg` (example: `photo-001-thumb.jpg`)

Where `[id]` matches the `id` field in `assets/data/gallery.json`.

## Image Guidelines

### Thumbnails
- Width: 400px (recommended)
- Maintain original aspect ratio
- JPEG quality: 80%
- Purpose: Fast loading on gallery page

### Full-Size Images
- Max width: 1920px (recommended)
- Maintain original aspect ratio
- JPEG quality: 85-90%
- Purpose: Display in lightbox

## Adding New Images

1. Add full-size image and thumbnail to this directory
2. Add corresponding entry to `assets/data/gallery.json`
3. Set `public: true` for public gallery visibility
4. Set `public: false` for Fan Club exclusive content
5. Gallery will automatically update on next page load

## Placeholder Images

Currently using placeholder images from `assets/images/logo.png` as fallbacks.
Replace with actual band photos when ready.

## Future Enhancements

- Automated thumbnail generation
- Image optimization pipeline
- CDN integration for better performance
- Photo upload interface (Phase 6+)
