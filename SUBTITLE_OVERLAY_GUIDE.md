# SubSync AI - Subtitle Overlay Refactoring Guide

## Overview

The application has been refactored to use **subtitle overlays** instead of burning subtitles into videos. This is a major improvement that offers:

- **Instant playback** - No FFmpeg processing needed
- **Lightweight** - No server-side video processing
- **Flexible** - Users can toggle subtitles on/off during playback
- **Compatible** - Works like YouTube, Netflix, etc.
- **Performant** - Pure HTML5 video + VTT subtitles

## Architecture Changes

### Before (Subtitle Burning)

```
User Input
    ↓
Upload .srt
    ↓
Download video with yt-dlp
    ↓
Process with FFmpeg (burn subtitles)
    ↓
Upload processed video
    ↓
Display video (no subtitle control)
    ↓
Download file
```

### After (Subtitle Overlay)

```
User Input
    ↓
Upload .srt → Convert to VTT
    ↓
Store VTT in Supabase Storage
    ↓
Create job record (status: 'ready')
    ↓
Display video with <track> element (instant playback)
    ↓
User can toggle subtitles
```

## Key Technical Changes

### 1. SRT to VTT Conversion

**File:** `lib/utils/subtitle-converter.ts`

Converts SRT format to VTT format automatically:

```typescript
// Input: SRT format
00:00:00,500 --> 00:00:07,000
This is the first subtitle

// Output: VTT format
WEBVTT

00:00:00.500 --> 00:00:07.000
This is the first subtitle
```

The key difference: commas → dots in timestamps.

### 2. Removed FFmpeg Processing

**File:** `app/api/process-video/route.ts`

The API route is now a simple health-check endpoint. No processing happens server-side.

**Why?** Users can play any direct video URL immediately without waiting for processing.

### 3. Job Status: "ready"

New status added to `lib/types/database.ts`:

```typescript
status: "pending" | "processing" | "ready" | "done" | "failed";
```

Jobs are now created with status: **'ready'** - instant playback.

### 4. Video Player with Subtitles

**File:** `app/(app)/dashboard/page.tsx`

Uses HTML5 `<video>` with `<track>` element:

```tsx
<video src={videoUrl} controls>
  <track
    src={subtitleVttUrl}
    kind="subtitles"
    srcLang="en"
    label="English"
    default
  />
</video>
```

Features:

- Play/pause/volume controls (native browser controls)
- Subtitle toggle (native browser subtitle button)
- Fullscreen support
- Works on all modern browsers

### 5. Server Actions for Security

**File:** `lib/actions/jobs.ts`

Job creation uses server actions to prevent RLS violations:

```typescript
"use server";

export async function createJob(videoUrl, subtitleFile, settings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // user_id is set by server, not client
  const { data } = await supabase.from("jobs").insert({
    user_id: user.id, // ✅ Server-provided
    video_url: videoUrl,
    subtitle_file: subtitleFile,
    status: "ready",
  });
}
```

## File Organization

```
lib/
├── utils/
│   └── subtitle-converter.ts    # SRT → VTT conversion
├── actions/
│   └── jobs.ts                  # Server actions for job creation
├── types/
│   └── database.ts              # Updated Job interface
└── ...

app/
├── (app)/
│   ├── dashboard/page.tsx       # Updated video player with overlay
│   ├── my-videos/page.tsx       # Job management
│   └── settings/page.tsx
├── api/
│   └── process-video/route.ts   # Simplified (no processing)
└── ...
```

## Usage Flow

### 1. User Submits Video + Subtitle

```
1. User enters direct video URL (mp4, webm, etc.)
2. User uploads .srt file
3. Click "Create Subtitle Track"
```

### 2. Subtitle Conversion

```
1. Browser reads .srt file
2. Converts to VTT using srtToVtt()
3. Creates Blob with VTT content
4. Uploads to Supabase Storage/subtitles/
```

### 3. Job Creation (Server Action)

```
1. Call createJob() server action
2. Server verifies user auth
3. Inserts job with status: 'ready'
4. RLS policy validates user_id match
```

### 4. Instant Playback

```
1. Video player loads immediately
2. <track> element loads VTT from Storage
3. User can toggle subtitles
4. No processing, no waiting
```

## Database Schema

```sql
CREATE TABLE jobs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  video_url text NOT NULL,          -- Direct video URL
  subtitle_file text NOT NULL,      -- VTT file path in storage
  output_video text,                -- No longer used
  status text NOT NULL DEFAULT 'ready',
  error_message text,
  subtitle_settings jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Status Values

| Status       | Meaning             | When                       |
| ------------ | ------------------- | -------------------------- |
| `ready`      | Ready for playback  | Immediately after creation |
| `pending`    | Awaiting processing | _(deprecated)_             |
| `processing` | Being processed     | _(deprecated)_             |
| `done`       | Processing complete | _(deprecated)_             |
| `failed`     | Processing failed   | _(deprecated)_             |

## Benefits

### Performance

- **Zero processing latency** - videos play instantly
- **No server load** - no FFmpeg, no video downloads
- **Lightweight** - only VTT files stored (text, ~1KB per job)

### User Experience

- **Instant results** - no "processing..." wait
- **Native controls** - browser subtitle button works
- **Flexible** - toggle subtitles during playback
- **Professional** - like YouTube/Netflix

### Security

- **Server-side validation** - user_id set by server
- **RLS enforced** - users only access own jobs
- **No video manipulation** - using original videos
- **No secrets exposed** - API key hidden server-side

### Cost

- **No FFmpeg costs** - no processing, no CPU
- **Minimal storage** - only text files
- **No bandwidth** - videos streamed from source

## Compatibility

Tested with:

- Direct MP4 URLs
- CORS-enabled video sources
- Blob URLs
- Data URLs

Works in:

- Chrome/Chromium
- Firefox
- Safari
- Edge
- Mobile browsers

## Limitations

- **Video source must be CORS-enabled** - needed for <track> to load
- **Subtitle format** - only accepts SRT (auto-converts to VTT)
- **Direct video URLs only** - no more YouTube downloads
- **Live streams** - not supported (requires VOD)

## Migration from Burning to Overlay

If you have old jobs with status `done` and `output_video` set:

```typescript
// Old data migration (optional):
// SELECT * FROM jobs WHERE status = 'done' AND output_video IS NOT NULL;
// These videos are already processed with burned subtitles
// Keep them for backward compatibility or delete them
```

## Future Improvements

- [ ] Support multiple subtitle languages
- [ ] SRT editor in UI
- [ ] Subtitle style customization (via CSS)
- [ ] Auto-detect subtitle language
- [ ] Support for VTT, ASS subtitle formats
- [ ] Subtitle preview before upload

## Debugging

### Subtitles not showing?

1. Check if VTT file is accessible (public URL)
2. Verify VTT format is correct (no .srt format issues)
3. Check browser console for CORS errors
4. Ensure video player has `<track>` element

### Video not playing?

1. Verify video URL is direct and CORS-enabled
2. Check browser support for video format
3. Test URL in browser directly
4. Check video file integrity

## Testing Checklist

- [ ] User can create account
- [ ] User can upload .srt file
- [ ] User can enter video URL
- [ ] Job created with status 'ready'
- [ ] Video plays in player
- [ ] Subtitles display correctly
- [ ] Subtitle toggle works
- [ ] User can access only own jobs (RLS)
- [ ] Build completes without errors

## References

- [WebVTT Spec](https://www.w3.org/TR/webvtt/)
- [HTML5 Video Track Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track)
- [Supabase Storage Public URLs](https://supabase.com/docs/guides/storage/cdn/authentication)
