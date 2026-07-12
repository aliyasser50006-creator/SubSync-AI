# SubSync AI - Project Overview

## What is SubSync AI?

SubSync AI is a production-ready full-stack SaaS web application that allows users to burn subtitles permanently into videos. Unlike optional subtitles that can be turned off, SubSync AI hardcodes subtitles directly into video frames using FFmpeg, ensuring they are always visible.

## Key Capabilities

1. **Video Input**: Accept YouTube URLs or direct video links
2. **Subtitle Upload**: Support for .srt subtitle files
3. **Custom Styling**: Full control over subtitle appearance
4. **Video Processing**: Automated video download and subtitle burning
5. **Real-time Updates**: Live status tracking during processing
6. **Video Preview**: Watch videos directly in the browser
7. **Download**: Download processed videos
8. **Secure Storage**: All files stored in Supabase Storage

## Technology Stack

### Frontend

- **Framework**: Next.js 13 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

### Backend

- **API**: Next.js API Routes
- **Runtime**: Node.js
- **Video Processing**: FFmpeg
- **Video Download**: yt-dlp

### Database & Services

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## Project Structure

```
subsync-ai/
├── app/                          # Next.js app directory
│   ├── (app)/                   # Protected routes group
│   │   ├── dashboard/           # Main video processing interface
│   │   ├── my-videos/           # Video library/history
│   │   ├── settings/            # User settings
│   │   └── layout.tsx           # Shared layout with sidebar
│   ├── api/
│   │   └── process-video/       # Video processing API endpoint
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── layout.tsx               # Root layout with auth provider
│   └── page.tsx                 # Home page (redirects)
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── app-sidebar.tsx          # Desktop navigation
│   ├── mobile-nav.tsx           # Mobile navigation
│   └── protected-route.tsx      # Route protection HOC
├── lib/
│   ├── contexts/
│   │   └── auth-context.tsx     # Authentication context
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   ├── server.ts            # Server-side Supabase
│   │   └── middleware.ts        # Auth middleware
│   ├── types/
│   │   └── database.ts          # TypeScript types
│   └── utils.ts                 # Utility functions
├── scripts/
│   └── setup-storage.sql        # Storage bucket setup
├── middleware.ts                # Next.js middleware
├── README.md                    # Main documentation
├── QUICKSTART.md                # Quick start guide
├── SETUP.md                     # Detailed setup guide
├── DEPLOYMENT.md                # Deployment guide
├── FEATURES.md                  # Feature checklist
└── PROJECT_OVERVIEW.md          # This file
```

## Core Features

### 1. Authentication System

- Email/password registration and login
- Persistent sessions with cookies
- Protected routes with automatic redirects
- Password change functionality
- Secure session management

### 2. Video Processing Pipeline

```
User Input → Upload Subtitle → Create Job → Download Video →
Burn Subtitles → Upload Result → Update Status → Notify User
```

### 3. Subtitle Customization

Users can customize:

- Font size (16-48px)
- Font color (any hex color)
- Outline color (any hex color)
- Outline width (0-5px)
- Position (top or bottom)
- Alignment (left, center, or right)
- Background box (on/off)

### 4. Real-time Updates

Using Supabase Realtime, users see:

- Instant status changes (pending → processing → done/failed)
- Live UI updates without refreshing
- No polling required

### 5. Video Management

- View all processed videos
- Play videos in-app
- Download videos
- Delete old videos
- See processing status

## Database Schema

### Jobs Table

```sql
CREATE TABLE jobs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  video_url text NOT NULL,
  subtitle_file text NOT NULL,
  output_video text,
  status text NOT NULL,
  error_message text,
  subtitle_settings jsonb,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Row Level Security

- Users can only access their own jobs
- All CRUD operations are user-scoped
- Secure by default

## Storage Structure

### Subtitles Bucket (Private)

```
subtitles/
└── {user_id}/
    └── {timestamp}_{filename}.srt
```

### Videos Bucket (Public)

```
videos/
└── {user_id}/
    └── {job_id}_output.mp4
```

## API Endpoints

### POST /api/process-video

Initiates video processing for a job.

**Request:**

```json
{
  "jobId": "uuid-here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Processing started"
}
```

**Process:**

1. Validates job exists
2. Updates status to "processing"
3. Downloads video with yt-dlp
4. Downloads subtitle from storage
5. Burns subtitles with FFmpeg
6. Uploads result to storage
7. Updates job with output path
8. Sets status to "done" or "failed"

## FFmpeg Command

The application uses FFmpeg with custom styling:

```bash
ffmpeg -i video.mp4 \
  -vf "subtitles=sub.srt:force_style='FontName=Arial,FontSize=28,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,BorderStyle=1,Outline=2,Shadow=1,Alignment=2'" \
  output.mp4
```

## Security Features

### Authentication

- Supabase Auth with JWT tokens
- Secure session management
- Protected API routes

### Database

- Row Level Security on all tables
- User-scoped data access
- No cross-user data leaks

### Storage

- Private subtitle files
- User-specific folders
- Secure file policies

### Input Validation

- File type checking (.srt only)
- URL validation
- Size limits
- Sanitized inputs

## Performance Optimizations

### Asynchronous Processing

- Video processing runs in background
- Users don't wait for completion
- Non-blocking API calls

### Database

- Indexed columns (user_id, status, created_at)
- Efficient queries
- Realtime subscriptions instead of polling

### Frontend

- Static page generation where possible
- Client-side state management
- Optimistic UI updates

## Deployment Options

### Option 1: Vercel + Worker

- Frontend on Vercel
- Separate worker for video processing
- Recommended for production

### Option 2: Full Server

- Deploy entire app to Railway/Render
- FFmpeg and yt-dlp on same server
- Simpler architecture

### Option 3: AWS

- Vercel/Amplify for frontend
- Lambda + EFS for processing
- SQS for job queue
- Most scalable but complex

## Environment Variables

Required variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Workflow

### Local Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run typecheck    # Check types
npm run build        # Build for production
```

### Testing

1. Create test account
2. Upload sample video and subtitle
3. Verify processing completes
4. Check video preview works
5. Test download functionality

## Monitoring & Maintenance

### Health Checks

- Monitor job failure rate
- Check processing times
- Track storage usage
- Monitor API errors

### Logs

- Application logs (Vercel/Railway)
- Supabase logs (database/storage)
- FFmpeg output logs
- Error tracking

## Future Enhancements

Potential additions:

- Batch processing multiple videos
- Auto-generated subtitles (AI)
- Video editing features
- Team collaboration
- Payment integration
- Email notifications
- Analytics dashboard
- Mobile apps

## Documentation Files

- **README.md**: Overview and main documentation
- **QUICKSTART.md**: Get started in 10 minutes
- **SETUP.md**: Detailed setup instructions
- **DEPLOYMENT.md**: Production deployment guide
- **FEATURES.md**: Complete feature checklist
- **PROJECT_OVERVIEW.md**: This file

## Support & Resources

### Getting Help

1. Read the documentation
2. Check error logs
3. Review Supabase dashboard
4. Open GitHub issue

### Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [FFmpeg Docs](https://ffmpeg.org/documentation.html)
- [yt-dlp Docs](https://github.com/yt-dlp/yt-dlp)

## License

MIT License - Free to use and modify

## Conclusion

SubSync AI is a complete, production-ready application that demonstrates:

- Modern web development with Next.js
- Full-stack TypeScript development
- Supabase integration (Auth, Database, Storage, Realtime)
- Video processing with FFmpeg
- Secure, scalable architecture
- Professional UI/UX design
- Comprehensive documentation

The application is ready to deploy and can serve real users immediately.
