# JSON Data Schema Standards

This document defines the schema conventions for all JSON data files in `assets/data/`.

---

## General Conventions

### Date Format

All dates MUST use **ISO 8601 format** with leading zeros:

```
YYYY-MM-DD
```

**Correct:**
```json
"date": "2024-05-29"
"releaseDate": "2024-11-15"
```

**Incorrect:**
```json
"date": "2024-5-29"    // Missing leading zero
"date": "05/29/2024"   // Wrong format
"date": "May 29, 2024" // Human-readable format
```

### Boolean Flags

Use `true`/`false` only. Common flags:

| Flag | Purpose |
|------|---------|
| `featured` | Highlights item on homepage or in listings |
| `public` | Controls visibility (public gallery vs Fan Club exclusive) |

### Placeholder Values

Use `"#"` for placeholder URLs that are not yet active.

### ID Format

Use kebab-case with optional type prefix:

```json
"id": "release-kraken-2024"
"id": "photo-001"
"id": "video-002"
```

---

## Schema: releases.json

Discography and album data.

```json
{
  "releases": [
    {
      "id": "release-example-2024",
      "title": "Album Title",
      "artist": "tHE dURT nURS'",
      "releaseDate": "2024-11-15",
      "type": "album",
      "coverArt": "/assets/images/album-cover.png",
      "coverArtAlt": "Description for screen readers",
      "coverArtVideo": "/assets/images/album-cover.mp4",
      "coverArtVideoPoster": "/assets/images/album-cover.png",
      "description": "Album description text",
      "tracklist": [
        { "title": "Track 1 Title", "hasAudio": false },
        { "title": "Track 2 Title", "hasAudio": true, "audioFile": "/assets/audio/album/track2.mp3", "duration": "3:42" }
      ],
      "featured": true
    }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (kebab-case) |
| `title` | string | Yes | Album/release title |
| `artist` | string | Yes | Artist name |
| `releaseDate` | string | Yes | ISO 8601 date |
| `type` | string | Yes | One of: `album`, `ep`, `single`, `live`, `compilation` |
| `coverArt` | string | Yes | Path to cover image |
| `coverArtAlt` | string | Yes | Alt text for accessibility |
| `coverArtVideo` | string | No | Path to animated cover video (MP4) |
| `coverArtVideoPoster` | string | No | Poster image for video (defaults to coverArt) |
| `description` | string | Yes | Album description |
| `tracklist` | array | Yes | Array of track objects (see Track Schema below) |
| `featured` | boolean | No | Highlight on homepage (default: false) |

### Animated Cover Art (Video)

Releases can have animated cover art using MP4/WebM video files. The video autoplays, loops, and is muted for a seamless visual experience.

**File naming convention:**
- MP4: `/assets/images/album-name.mp4`
- WebM: `/assets/images/album-name.webm` (auto-detected from MP4 path)
- Poster: Use the static PNG/JPG cover art as the poster

**Example:**
```json
{
  "coverArt": "/assets/images/the-ecclesiastical-tapes.png",
  "coverArtAlt": "Two robed figures playing instruments",
  "coverArtVideo": "/assets/images/the-ecclesiastical-tapes.mp4"
}
```

> **Note:** Streaming links (Spotify, Apple Music, etc.) are not currently supported at the release level. Audio playback is handled via individual tracks with the `audioFile` field, and external links can be added at the track level via `sunoUrl`.

### Track Schema

Each track in the tracklist is an object with the following fields:

```json
"tracklist": [
  {
    "title": "Track Title",
    "hasAudio": true,
    "audioFile": "/assets/audio/album/track.mp3",
    "duration": "3:42",
    "sunoUrl": "https://suno.com/song/abc123",
    "artwork": "/assets/images/songs/track-art.png",
    "artworkAlt": "Description of track artwork",
    "artworkVideo": "/assets/images/songs/track-art.mp4",
    "artworkVideoPoster": "/assets/images/songs/track-art.png",
    "featured": true
  },
  {
    "title": "Unreleased Track",
    "hasAudio": false
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Track name |
| `hasAudio` | boolean | Yes | Whether playable audio exists |
| `audioFile` | string | If hasAudio | Path to MP3 file |
| `duration` | string | If hasAudio | Track length (MM:SS format) |
| `sunoUrl` | string | No | Link to Suno platform |
| `artwork` | string | No | Track-specific artwork (falls back to album art) |
| `artworkAlt` | string | No | Alt text for track artwork |
| `artworkVideo` | string | No | Animated track artwork video (MP4) |
| `artworkVideoPoster` | string | No | Poster image for video (defaults to artwork) |
| `featured` | boolean | No | Highlight as featured song (default: false) |

> **Note:** Track artwork video fields follow the same conventions as album cover videos. If a track has `artworkVideo` specified, it will display as animated artwork. If not, the track inherits the album's video (if any) or falls back to static images.

---

## Schema: announcements.json

News and updates displayed on the News page.

```json
{
  "announcements": [
    {
      "id": "001",
      "date": "2024-11-15",
      "title": "Announcement Title",
      "category": "news",
      "excerpt": "Short preview text (< 150 characters)",
      "content": "<p>Full HTML content...</p>",
      "link": {
        "url": "https://example.com",
        "text": "Link Text"
      },
      "featured": true
    }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `date` | string | Yes | ISO 8601 date |
| `title` | string | Yes | Announcement headline |
| `category` | string | Yes | One of: `news`, `release`, `show`, `general` |
| `excerpt` | string | Yes | Short preview (< 150 chars) |
| `content` | string | Yes | Full content (HTML allowed) |
| `link` | object | No | Optional CTA link |
| `link.url` | string | Yes* | Link destination (*if link provided) |
| `link.text` | string | Yes* | Link button text (*if link provided) |
| `featured` | boolean | No | Highlight announcement (default: false) |

---

## Schema: gallery.json

Photos and videos for public gallery and Fan Club.

```json
{
  "media": [
    {
      "id": "photo-001",
      "type": "photo",
      "title": "Photo Title",
      "description": "Photo description",
      "filename": "image.jpg",
      "thumbnail": "image-thumb.jpg",
      "date": "2024-05-29",
      "category": "band",
      "public": true,
      "featured": false
    },
    {
      "id": "video-001",
      "type": "video",
      "title": "Video Title",
      "description": "Video description",
      "embedUrl": "https://www.youtube.com/embed/videoId",
      "thumbnail": "video-thumb.jpg",
      "date": "2024-11-01",
      "category": "performance",
      "public": false,
      "featured": false
    }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier with type prefix |
| `type` | string | Yes | One of: `photo`, `video` |
| `title` | string | Yes | Media title |
| `description` | string | Yes | Caption/description |
| `filename` | string | Photos | Image filename (in `assets/images/gallery/`) |
| `thumbnail` | string | Yes | Thumbnail filename |
| `embedUrl` | string | Videos | YouTube/Vimeo embed URL |
| `date` | string | Yes | ISO 8601 date |
| `category` | string | Yes | One of: `band`, `performance`, `backstage`, `historical` |
| `public` | boolean | Yes | `true` = public gallery, `false` = Fan Club only |
| `featured` | boolean | No | Highlight in gallery (default: false) |

---

## Schema: merch.json

Product catalog for the parody merchandise store.

```json
{
  "merchandise": [
    {
      "id": "merch-product-name",
      "title": "Product Title",
      "price": "49.99",
      "image": "/assets/images/merch/product.png",
      "imageAlt": "Product description for accessibility",
      "description": "Humorous product description",
      "badge": "new",
      "available": true,
      "category": "apparel",
      "featured": true
    }
  ],
  "salesBanner": {
    "active": true,
    "message": "FLASH SALE: Banner text",
    "subtext": "Optional subtext"
  }
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier with `merch-` prefix |
| `title` | string | Yes | Product name |
| `price` | string | Yes | Display price (without $ symbol) |
| `image` | string | Yes | Path to product image |
| `imageAlt` | string | Yes | Alt text for accessibility |
| `description` | string | Yes | Humorous product description |
| `badge` | string | No | One of: `new`, `sold`, `wow`, `hot`, or null |
| `available` | boolean | Yes | Whether item can be "purchased" |
| `category` | string | Yes | Product category (apparel, drinkware, accessories) |
| `featured` | boolean | No | Highlight on page (default: false) |

### Sales Banner

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `active` | boolean | Yes | Show/hide banner |
| `message` | string | Yes | Main banner text (uppercase recommended) |
| `subtext` | string | No | Secondary italic text |

---

## Schema: hero-objects.json

Image manifest for the hero kaleidoscope animation. Auto-generated by `npm run prepare-hero`.

```json
{
  "objects": [
    {
      "id": "hero-obj-01",
      "src": "/assets/images/hero-objects/hero-obj-01.png",
      "width": 200,
      "height": 133
    }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Auto-generated identifier (`hero-obj-NN`) |
| `src` | string | Yes | Path to resized PNG (max 200px) |
| `width` | number | Yes | Image width in pixels |
| `height` | number | Yes | Image height in pixels |

> **Note:** Do not edit this file manually. It is regenerated by `npm run prepare-hero` from source PNGs. See `docs/BUILD_COMMANDS.md` for the image workflow.

---

## Adding New Data Files

When creating new JSON data files:

1. Use a root-level array wrapper with descriptive key:
   ```json
   {
     "items": [ ... ]
   }
   ```

2. Follow the conventions above for dates, IDs, and booleans

3. Document the schema in this file

4. Update consuming JavaScript to use `DurtNursUtils.fetchJSON()`

---

## Validation

JSON files are validated by:
- JavaScript runtime parsing (errors logged to console)
- Build process (11ty will fail on invalid JSON)

Consider adding JSON Schema validation in the future for stricter enforcement.

---

*Last updated: February 2026*
