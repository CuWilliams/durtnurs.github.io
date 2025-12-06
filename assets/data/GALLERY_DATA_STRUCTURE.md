# Gallery Data Structure Documentation

This document describes the JSON data structure used for the tHE dURT nURS' gallery system. The gallery supports both the public gallery (Phase 5) and the full Fan Club gallery (Phase 6).

---

## Phase 5 vs Phase 6: The Public Flag

The `"public"` flag is **CRITICAL** for the dual gallery system:

### Public Gallery (Phase 5 - gallery.html)
- Shows ONLY items where `"public": true`
- Curated, family-friendly content
- Anyone can view without login
- Filtered using: `media.filter(item => item.public === true)`

### Fan Club Gallery (Phase 6 - fanclub.html)
- Shows ALL items (`public: true` AND `public: false`)
- Behind-the-scenes, exclusive content
- Requires password/access control
- No filtering applied: displays entire media array

This approach allows us to maintain **ONE data source** for both galleries, simplifying content management while enabling access control.

---

## Media Item Structure

Each media object in the `gallery.json` file contains the following properties:

### `id` (string, required)
- Unique identifier in kebab-case
- Format: `"photo-001"` or `"video-001"`
- Used for: DOM element IDs, deep linking, JavaScript references
- Must be unique across all media items

### `type` (string, required)
- Media type: `"photo"` or `"video"`
- Used for: rendering logic, UI styling, lightbox behavior
- Photos display as `<img>`, videos display as `<iframe>` embeds

### `title` (string, required)
- Media title/caption
- Displayed prominently on card
- Keep concise (3-6 words ideal)

### `description` (string, required)
- Brief description or context
- 1-2 sentences
- Include band humor and personality

### `filename` (string, required for photos)
- Path to full-size image relative to `assets/images/`
- Example: `"photo-001.jpg"`
- Full path becomes: `assets/images/gallery/photo-001.jpg`
- Used in lightbox for full-size display

### `thumbnail` (string, required for photos)
- Path to thumbnail image relative to `assets/images/`
- Example: `"photo-001-thumb.jpg"`
- Thumbnails should be ~400px wide for performance
- **Why separate thumbnails?** Faster page load, better mobile performance

### `embedUrl` (string, required for videos)
- Full YouTube/Vimeo embed URL
- Format: `"https://www.youtube.com/embed/VIDEO_ID"`
- **NOT** the watch URL - must be embed format
- Used in lightbox `<iframe>` for video playback

### `date` (string, required)
- Date media was created/captured
- Format: ISO 8601 (`YYYY-MM-DD`)
- **Why ISO?** Universal standard, sortable, parseable by JavaScript `Date()`
- Used for: sorting gallery, displaying dates, filtering by timeframe

### `category` (string, required)
- Content category for organization/filtering
- Values: `"band"`, `"performance"`, `"backstage"`, `"historical"`, `"misc"`
- Used for: potential future filtering UI, visual styling variations
- Allows users to browse by category in Phase 6 enhancements

### `public` (boolean, required)
- Access control flag
- `true` = Show in public gallery (gallery.html)
- `false` = Show ONLY in Fan Club gallery (fanclub.html)
- This is the **PRIMARY filter** for Phase 5 gallery
- Set to `false` for behind-the-scenes, exclusive, or member-only content

### `featured` (boolean, required)
- Highlight flag for special items
- `true` = Display with special styling (larger card, prominent border)
- `false` = Normal card styling
- Use for: newest content, best photos, important announcements
- Only 1-2 items should be featured at a time

---

## Image Path Conventions

All images are stored in: **`assets/images/gallery/`**

### File Naming Convention
- **Full images:** `[id].jpg` (example: `photo-001.jpg`)
- **Thumbnails:** `[id]-thumb.jpg` (example: `photo-001-thumb.jpg`)

### Thumbnail Strategy
- Create thumbnails at ~400px width
- Maintain original aspect ratio
- Use compression (80% JPEG quality)
- **Why?** Dramatically reduces page load time on mobile
- Full images load only when clicked (in lightbox)

---

## Example Media Item

### Photo Example
```json
{
  "id": "photo-001",
  "type": "photo",
  "title": "The Secret Lair",
  "description": "Our legendary practice shed. Where the magic (and several noise complaints) happen.",
  "filename": "secret-lair-1.jpeg",
  "thumbnail": "secret-lair-1-thumb.jpg",
  "date": "2024-05-29",
  "category": "band",
  "public": true,
  "featured": true
}
```

### Video Example
```json
{
  "id": "video-001",
  "type": "video",
  "title": "Brass Knuckles (Live Rehearsal)",
  "description": "Raw footage from the shed. Before the polish. Before the mixing. Before we sobered up.",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "thumbnail": "video-001-thumb.jpg",
  "date": "2024-11-01",
  "category": "performance",
  "public": true,
  "featured": false
}
```

---

## Future Enhancements

This structure supports future features like:
- Category filtering (buttons to show only "band" or "performance" photos)
- Date range filtering (show photos from specific year)
- Search functionality (search titles and descriptions)
- Photo upload system (admin interface to add new media)
- Pagination (show 12 items per page)
- Lazy loading (load images as user scrolls)
- Social sharing (share individual photos)
- Comments/reactions (Phase 6+ with authentication)

---

## Content Management Workflow

### To add new media:
1. Add image files to `assets/images/gallery/`
2. Create thumbnail versions (400px width)
3. Add new object to the `gallery.json` array
4. Set `"public": true` for public gallery
5. Set `"public": false` for Fan Club exclusive content
6. Set `"featured": true` for 1-2 newest/best items
7. Gallery will automatically update on next page load

**No code changes required - this is pure data management!**

---

## Important Notes

### JSON Syntax Rules
- **JSON does NOT support comments** - do not add `//` or `/* */` comments to `gallery.json`
- All property names must be in double quotes
- String values must be in double quotes
- Boolean values are lowercase: `true` or `false`
- No trailing commas after the last item in arrays or objects

### File Location
- Data file: `assets/data/gallery.json`
- JavaScript module: `assets/js/gallery.js`
- Image directory: `assets/images/gallery/`

### Validation
Before committing changes to `gallery.json`, validate the JSON syntax:
- Use an online JSON validator (e.g., jsonlint.com)
- Or use your code editor's JSON validation features
- Invalid JSON will cause the gallery to fail to load
