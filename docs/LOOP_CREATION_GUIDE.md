# Instagram Video Loop Creation Guide

Quick reference for creating Instagram video loops using FFmpeg with static album art and audio clips.

---

## Standard Templates

### 15-Second Loop (End Fade Only)

**Use case:** Quick teaser, hook-focused preview
```bash
ffmpeg -loop 1 -i album-art.png -ss 0 -t 15 -i song.mp3 \
-filter_complex \
"[1:a]afade=t=out:st=13.5:d=1.5[a];\
[0:v]scale=1080:1080,vignette=angle=PI/4,noise=alls=18:allf=t+u,eq=brightness=0.03:saturation=1.15[v]" \
-map "[v]" -map "[a]" \
-t 15 -shortest \
-c:v libx264 -pix_fmt yuv420p \
-c:a aac -b:a 192k \
-movflags +faststart \
output-15s.mp4
```

**Parameters:**
- **Audio start:** 0:00 (beginning of track)
- **Duration:** 15 seconds
- **Fade out:** starts at 13.5s, duration 1.5s
- **No fade in** (clean start)

---

### 30-Second Loop (Quick Fade In/Out)

**Use case:** Longer preview, mid-song section, Reels
```bash
ffmpeg -loop 1 -i album-art.png -ss 00:20 -t 30 -i song.mp3 \
-filter_complex \
"[1:a]afade=t=in:st=0:d=0.5,afade=t=out:st=29.5:d=0.5[a];\
[0:v]scale=1080:1080,vignette=angle=PI/4,noise=alls=18:allf=t+u,eq=brightness=0.03:saturation=1.15[v]" \
-map "[v]" -map "[a]" \
-t 30 -shortest \
-c:v libx264 -pix_fmt yuv420p \
-c:a aac -b:a 192k \
-movflags +faststart \
output-30s.mp4
```

**Parameters:**
- **Audio start:** 0:20 (20 seconds into track)
- **Duration:** 30 seconds (extracts 0:20 to 0:50)
- **Fade in:** starts at 0s, duration 0.5s
- **Fade out:** starts at 29.5s, duration 0.5s

---

## Visual Effects Breakdown

All templates use the following effect chain for gritty, dive-bar aesthetic:
```bash
scale=1080:1080,vignette=angle=PI/4,noise=alls=18:allf=t+u,eq=brightness=0.03:saturation=1.15
```

**Effect components:**
1. **`scale=1080:1080`** — Instagram square format (1:1 ratio)
2. **`vignette=angle=PI/4`** — Darkened edges, focus on center
3. **`noise=alls=18:allf=t+u`** — Film grain texture (18 = moderate grain)
4. **`eq=brightness=0.03:saturation=1.15`** — Slight brightness boost + warm color

---

## Customization Guide

### Adjust Audio Timing

**Change start point:**
```bash
-ss 00:20    # Start at 20 seconds
-ss 01:40    # Start at 1 minute 40 seconds
```

**Change duration:**
```bash
-t 15    # 15-second clip
-t 30    # 30-second clip
-t 60    # 60-second clip (max for feed posts)
```

### Adjust Fade Timing

**Fade in:**
```bash
afade=t=in:st=0:d=0.5     # Quick 0.5s fade in
afade=t=in:st=0:d=1.0     # Slower 1.0s fade in
```

**Fade out:**
```bash
afade=t=out:st=29.5:d=0.5    # Quick 0.5s fade out starting at 29.5s
afade=t=out:st=28:d=2        # Longer 2s fade out starting at 28s
```

**Formula:** `st = duration - fade_duration`

### Adjust Visual Effects

**More grain (grittier):**
```bash
noise=alls=25:allf=t+u
```

**Less grain (cleaner):**
```bash
noise=alls=10:allf=t+u
```

**No grain:**
```bash
# Remove entire noise filter
scale=1080:1080,vignette=angle=PI/4,eq=brightness=0.03:saturation=1.15
```

**Stronger vignette (darker edges):**
```bash
vignette=angle=PI/3
```

**No vignette:**
```bash
# Remove vignette filter
scale=1080:1080,noise=alls=18:allf=t+u,eq=brightness=0.03:saturation=1.15
```

**Warmer colors:**
```bash
eq=brightness=0.05:saturation=1.3
```

**Cooler/desaturated:**
```bash
eq=brightness=-0.02:saturation=0.9
```

---

## Instagram Format Guidelines

### Video Length Limits

| Format | Max Length | Recommended |
|--------|-----------|-------------|
| Feed Post | 60 seconds | 15-30 seconds |
| Reel | 90 seconds | 15-30 seconds |
| Story | 60 seconds | 15 seconds |

### Technical Specs

- **Resolution:** 1080x1080 (square, 1:1 ratio)
- **Video codec:** H.264 (libx264)
- **Audio codec:** AAC, 192kbps
- **Frame rate:** 30fps
- **Pixel format:** yuv420p

---

## Quick Workflow

1. **Choose template** (15s or 30s)
2. **Replace filenames:**
   - `album-art.png` → your album art file
   - `song.mp3` → your audio file
   - `output.mp4` → your desired output name
3. **Adjust timing** if needed (`-ss` for start, `-t` for duration)
4. **Run command** in terminal
5. **Upload to Instagram**

---

## Example: Custom 23-Second Clip

Starting at 1:40, ending at 2:03, with 1-second fades:
```bash
ffmpeg -loop 1 -i album-art.png -ss 01:40 -t 23 -i song.mp3 \
-filter_complex \
"[1:a]afade=t=in:st=0:d=1,afade=t=out:st=22:d=1[a];\
[0:v]scale=1080:1080,vignette=angle=PI/4,noise=alls=18:allf=t+u,eq=brightness=0.03:saturation=1.15[v]" \
-map "[v]" -map "[a]" \
-t 23 -shortest \
-c:v libx264 -pix_fmt yuv420p \
-c:a aac -b:a 192k \
-movflags +faststart \
custom-23s.mp4
```

---

## Troubleshooting

**Video too large for Instagram:**
- Reduce bitrate: `-b:v 2M` (default is higher)
- Compress audio: `-b:a 128k` (instead of 192k)

**Colors look washed out:**
- Increase saturation: `eq=saturation=1.3`
- Add slight contrast: `eq=contrast=1.1`

**Audio doesn't sync:**
- Check `-ss` timing matches your intended start point
- Verify source audio file isn't corrupted

**File won't upload to Instagram:**
- Ensure `-pix_fmt yuv420p` is included
- Add `-movflags +faststart` for web optimization
- Check file size (Instagram prefers <100MB)

---

## Notes

- All commands tested on macOS/Linux with FFmpeg 4.4+
- Visual effects optimized for tHE dURT nURS' gritty aesthetic
- Ken Burns effect intentionally removed for static look
- Grain/vignette creates aged, dive-bar concert footage vibe

---

*Last updated: February 2025*
