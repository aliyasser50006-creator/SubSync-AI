# Quick Start Guide - SubSync AI

Get SubSync AI running in 10 minutes!

## Step 1: Install Dependencies (2 min)

```bash
npm install
```

## Step 2: Set Up Supabase (3 min)

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project details
4. Wait for database to initialize

### 2.2 Get Your Credentials

1. Go to Settings → API
2. Copy your project URL
3. Copy your anon/public key

### 2.3 Configure Environment

Create `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Set Up Storage Buckets (2 min)

### Option A: Using SQL Editor

1. Go to SQL Editor in Supabase
2. Copy contents of `scripts/setup-storage.sql`
3. Paste and run

### Option B: Manual Setup

1. Go to Storage in Supabase
2. Create bucket: `subtitles` (private)
3. Create bucket: `videos` (public)
4. Add policies from `scripts/setup-storage.sql`

## Step 4: Install Server Tools (2 min)

### FFmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### yt-dlp

```bash
# Using pip
pip install yt-dlp

# Using curl (Linux/Mac)
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### Verify Installation

```bash
ffmpeg -version
yt-dlp --version
```

## Step 5: Run the App (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Test It Out!

### 6.1 Create Account

1. Click "Sign up"
2. Enter email and password
3. Click "Create Account"

### 6.2 Process Your First Video

1. **Video URL**: Paste a YouTube URL
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
2. **Subtitle File**: Upload a `.srt` file
3. **Customize**: Adjust styling
4. **Generate**: Click "Generate Video"
5. **Watch**: See it process in real-time!

## Common Issues

### "Supabase URL not defined"

- Make sure `.env.local` exists
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Storage bucket not found"

- Run the SQL script in `scripts/setup-storage.sql`
- Make sure buckets are named exactly: `subtitles` and `videos`

### "FFmpeg not found"

- Install FFmpeg (see Step 4)
- Make sure it's in your PATH: `which ffmpeg`

### "yt-dlp not found"

- Install yt-dlp (see Step 4)
- Make sure it's accessible: `which yt-dlp`

### Video processing fails

- Check server logs for specific error
- Verify video URL is valid and accessible
- Check temp directory has write permissions

## What's Next?

- Read [README.md](./README.md) for full documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Review [SETUP.md](./SETUP.md) for detailed configuration

## Features to Try

1. **Custom Styling**: Change font colors, sizes, and positions
2. **Multiple Videos**: Process several videos
3. **Video Library**: View all your processed videos in "My Videos"
4. **Download**: Download any processed video
5. **Real-time Updates**: Watch status change live

## Development Tips

### Running Tests

```bash
npm run typecheck  # Check TypeScript types
```

### Building for Production

```bash
npm run build      # Create production build
npm start          # Run production server
```

### Cleaning Up

```bash
rm -rf .next       # Remove build cache
rm -rf node_modules # Remove dependencies
npm install        # Reinstall fresh
```

## Need Help?

- Check the logs in your terminal
- Review Supabase dashboard for database/storage issues
- Open an issue on GitHub
- Read the documentation files

## Pro Tips

1. **Use short videos for testing** - Start with 10-30 second videos
2. **Check subtitle formatting** - Make sure .srt file is valid
3. **Monitor storage usage** - Keep an eye on Supabase storage quota
4. **Test locally first** - Get everything working locally before deploying

## Ready for Production?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions!
