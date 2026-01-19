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

Use `"#"` for placeholder URLs that are not yet active:

```json
"streamingLinks": {
  "spotify": "#",
  "suno": "https://suno.ai/song/actual-id"
}
```

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
      "description": "Album description text",
      "tracklist": [
        "Track 1 Title",
        "Track 2 Title"
      ],
      "streamingLinks": {
        "suno": "https://suno.ai/...",
        "bandcamp": "#"
      },
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
| `description` | string | Yes | Album description |
| `tracklist` | array | Yes | Array of track objects (see Track Schema below) |
| `streamingLinks` | object | No | Platform URLs (use `"#"` for placeholders) |
| `featured` | boolean | No | Highlight on homepage (default: false) |

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
    "artwork": "/assets/images/tracks/track-art.png",
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
| `featured` | boolean | No | Highlight as featured song (default: false) |

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

*Last updated: January 2026*
