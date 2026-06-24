# SubSync AI - Setup Instructions

## Prerequisites

Before running this application, ensure you have:

1. Node.js 18+ installed
2. A Supabase account and project
3. FFmpeg installed on your server (for video processing)
4. yt-dlp installed on your server (for downloading videos)

## Environment Setup

1. Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Get your Supabase credentials from your Supabase project dashboard

## Supabase Configuration

### Database Setup

The database migration has already been applied. The `jobs` table is created with Row Level Security enabled.

### Storage Buckets Setup

You need to create two storage buckets in your Supabase project:

1. **subtitles** bucket:
   - Go to Storage in your Supabase dashboard
   - Click "Create bucket"
   - Name: `subtitles`
   - Public: No (private)
   - Allowed MIME types: `text/plain, text/srt, application/x-subrip`
   - File size limit: 10MB

2. **videos** bucket:
   - Click "Create bucket"
   - Name: `videos`
   - Public: Yes (for video playback)
   - Allowed MIME types: `video/mp4, video/webm`
   - File size limit: 500MB (or as needed)

### Storage Policies

For the **subtitles** bucket, add these policies:

1. **Upload Policy** (INSERT):

```sql
bucket_id = 'subtitles' AND auth.uid()::text = (storage.foldername(name))[1]
```

2. **Read Policy** (SELECT):

```sql
bucket_id = 'subtitles' AND auth.uid()::text = (storage.foldername(name))[1]
```

3. **Update Policy** (UPDATE, add the expression to both `USING` and `WITH CHECK`):

```sql
bucket_id = 'subtitles' AND auth.uid()::text = (storage.foldername(name))[1]
```

4. **Delete Policy** (DELETE):

```sql
bucket_id = 'subtitles' AND auth.uid()::text = (storage.foldername(name))[1]
```

For the **videos** bucket, add these policies:

1. **Upload Policy** (INSERT):

```sql
bucket_id = 'videos' AND auth.uid() IS NOT NULL
```

2. **Read Policy** (SELECT):

```sql
bucket_id = 'videos'
```

3. **Delete Policy** (DELETE):

```sql
bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]
```

## Server Requirements

For video processing to work, your server needs:

### Install FFmpeg

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**

```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### Install yt-dlp

```bash
pip install yt-dlp
# or
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## Important Notes

- The video processing API route (`/api/process-video`) requires FFmpeg and yt-dlp to be installed on the server
- Processing happens asynchronously - users don't need to wait for the video to finish processing
- Real-time updates are powered by Supabase Realtime
- Videos are stored in Supabase Storage and served directly from there
- All user data is protected with Row Level Security (RLS)

## Troubleshooting

### FFmpeg not found

Make sure FFmpeg is installed and accessible in your system's PATH.

### yt-dlp errors

Ensure yt-dlp is up to date: `yt-dlp -U`

### Storage bucket errors

Verify that both storage buckets exist and have the correct policies applied.

### Authentication issues

Check that your Supabase URL and anon key are correctly set in `.env.local`
