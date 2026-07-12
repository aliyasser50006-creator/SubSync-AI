# SubSync AI - Burn Subtitles into Videos & Subtitle Overlays

A production-ready, full-stack SaaS application for managing, previewing, and rendering subtitles for videos. SubSync AI supports both client-side HTML5 subtitle overlays (VTT format) and server-side subtitle burning using FFmpeg.

---

## 📖 Table of Contents

1. [Architecture: Subtitle Overlays vs. Subtitle Burning](#-architecture-subtitle-overlays-vs-subtitle-burning)
2. [Core Features](#-core-features)
3. [Technology Stack](#-technology-stack)
4. [Project Directory Structure](#-project-directory-structure)
5. [Local Development Setup](#-local-development-setup)
6. [Supabase Configuration & Storage Policies](#-supabase-configuration--storage-policies)
7. [Database Schema](#-database-schema)
8. [Security & RLS Model (Server Actions)](#-security--rls-model-server-actions)
9. [API Reference](#-api-reference)
10. [Deployment Guide](#-deployment-guide)
11. [Troubleshooting](#-troubleshooting)
12. [Post-Deployment Checklist](#-post-deployment-checklist)
13. [Licensing & Support](#-licensing--support)

---

## 🏗️ Architecture: Subtitle Overlays vs. Subtitle Burning

SubSync AI is architected to prioritize user experience, performance, and cost efficiency. The platform transitioned to using **Subtitle Overlays** as the primary playback mechanism while retaining a fallback pipeline for **Subtitle Burning**.

| Feature / Metric | Subtitle Overlays (Default) | Subtitle Burning (Legacy Pipeline) |
| :--- | :--- | :--- |
| **Technology** | HTML5 `<video>` + `<track>` with WebVTT | FFmpeg + `yt-dlp` backend compilation |
| **Latency** | **Instant** (plays immediately after upload) | **High** (minutes spent waiting for downloads/renders) |
| **Server Load** | **Zero CPU load** (handled client-side by browser) | **Very High CPU load** (compiles video frame-by-frame) |
| **Storage Cost** | **Minimal** (stores only VTT text files, ~1KB each) | **High** (stores full output video files, ~50MB+ each) |
| **Bandwidth** | Streamed directly from source URL | Multi-gigabyte downloads & uploads to storage |
| **Togglability** | Can be toggled on/off natively by users | Permanently hardcoded (cannot be turned off) |
| **CORS Requirement** | Requires CORS headers on video sources | None (source is downloaded to server disk) |

### SRT to WebVTT Conversion Pipeline

When a user uploads a standard `.srt` subtitle file, the client immediately parses it and converts it to WebVTT (`.vtt`) format using `srtToVtt` in [`lib/utils/subtitle-converter.ts`](./lib/utils/subtitle-converter.ts).

```typescript
// commmas are converted to dots for timestamps:
00:00:00,500 --> 00:00:07,000  =>  00:00:00.500 --> 00:00:07.000
```

This WebVTT file is then uploaded to Supabase Storage, and a job record is generated with a status of `ready`. The HTML5 player renders this file seamlessly:

```tsx
<video src={videoUrl} controls>
  <track src={vttStorageUrl} kind="subtitles" srcLang="en" label="English" default />
</video>
```

---

## ✨ Core Features

### 🔐 Authentication & Security
- [x] Email/Password registration & login via Supabase Auth
- [x] Persistent session tracking with cookie authentication middleware
- [x] Auto-redirect protection on restricted dashboard pages
- [x] In-app password change functionality
- [x] Row Level Security (RLS) policies protecting database mutations

### 🎥 Subtitle Rendering & Customization
- [x] Convert SRT subtitle files to WebVTT instantly on the frontend
- [x] Direct streaming of CORS-enabled video files
- [x] Style customizations (saved per job in `subtitle_settings` JSONB):
  - Font Size (16px - 48px)
  - Text & Outline Colors
  - Text Alignment (Left, Center, Right) and Positioning (Top, Bottom)
  - Background Box toggle
- [x] Legacy integration: Server-side rendering scripts to burn text permanently using FFmpeg

### 🗃️ Job & Video Library
- [x] Unified dashboard for submitting new videos and uploading tracks
- [x] Real-time job status tracking (`ready`, `pending`, `processing`, `done`, `failed`)
- [x] Supabase Realtime subscriptions to reflect processing changes without page refresh
- [x] "My Videos" library containing all historically saved subtitle tracks
- [x] Deletion cleaning that automatically purges database records and corresponding Storage files

---

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui components
- **Database & Services**: Supabase (PostgreSQL with RLS)
- **Real-time Engine**: Supabase Realtime
- **File Storage**: Supabase Storage Buckets
- **Processing Tools (Legacy)**: FFmpeg & `yt-dlp`

---

## 📁 Project Directory Structure

```
├── app/
│   ├── (app)/               # Protected SaaS dashboard routes
│   │   ├── dashboard/       # Main video submission UI & video player
│   │   ├── my-videos/       # Video history list with delete/download
│   │   └── settings/        # Account profile & password updates
│   ├── api/
│   │   ├── jobs/
│   │   │   └── delete/      # Secure API route to purge database & storage objects
│   │   └── process-video/   # API route verifying server-side pipeline health
│   ├── login/               # Authentication sign-in screen
│   ├── register/            # Sign-up page
│   └── layout.tsx           # Global provider layout (Auth, Theme)
├── components/
│   ├── ui/                  # Tailored shadcn base components
│   ├── app-sidebar.tsx      # Persistent dashboard sidebar
│   ├── mobile-nav.tsx       # Bottom navigation for mobile viewports
│   └── protected-route.tsx  # Authentication wrapper
├── lib/
│   ├── actions/
│   │   └── jobs.ts          # Server Actions preventing database RLS write violations
│   ├── contexts/
│   │   └── auth-context.tsx # React Context manager for user session state
│   ├── supabase/
│   │   ├── client.ts        # Browser Supabase SDK client
│   │   ├── server.ts        # Next.js Server-side client generator
│   │   └── middleware.ts    # Session updates in Next.js middleware
│   └── types/
│       └── database.ts      # TypeScript interfaces for Jobs & Subtitle Settings
├── supabase/
│   └── migrations/          # Version-controlled DB schemas and RLS definitions
└── scripts/
    └── setup-storage.sql    # Type definitions & references for storage buckets
```

---

## 💻 Local Development Setup

### Prerequisites
1. **Node.js**: Version 18 or higher.
2. **Supabase CLI** (optional) or a free project hosted on [supabase.com](https://supabase.com).
3. **FFmpeg & yt-dlp** (Only required if testing local server-side video burning).

### Installation Instructions

1. **Clone the repository and install npm packages**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file in the root of the project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-public-anon-key
   ```

3. **Install FFmpeg (for local server-side burning validation)**:
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt update && sudo apt install -y ffmpeg`
   - **Windows**: Download compiled binaries from [ffmpeg.org](https://ffmpeg.org/download.html) and add them to your system `PATH`.

4. **Install yt-dlp**:
   - **macOS/Linux**:
     ```bash
     sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
     sudo chmod a+rx /usr/local/bin/yt-dlp
     ```
   - **Windows/Python Environments**:
     ```bash
     pip install yt-dlp
     ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🗄️ Supabase Configuration & Storage Policies

Two distinct storage buckets must be created within your Supabase Dashboard:

### 1. `subtitles` (Private Bucket)
- **Purpose**: Stores VTT/SRT subtitle files.
- **Allowed MIME types**: `text/plain`, `text/srt`, `application/x-subrip`, `text/vtt`
- **File size limit**: 10MB
- **Policies**:
  - **INSERT (Upload)**:
    ```sql
    bucket_id = 'subtitles' AND auth.uid()::text = (storage.foldername(name))[1]
    ```
  - **SELECT (Read)**:
    ```sql
    bucket_id = 'subtitles' AND auth.uid()::text = (storage.foldername(name))[1]
    ```
  - **UPDATE (Replace/Autosave)** (`USING` and `WITH CHECK`):
    ```sql
    bucket_id = 'subtitles' AND auth.uid()::text = (storage.foldername(name))[1]
    ```
  - **DELETE**:
    ```sql
    bucket_id = 'subtitles' AND auth.uid()::text = (storage.foldername(name))[1]
    ```

### 2. `videos` (Public Bucket)
- **Purpose**: Stores output videos if using the legacy burning flow.
- **Allowed MIME types**: `video/mp4`, `video/webm`
- **File size limit**: 500MB
- **Policies**:
  - **INSERT (Upload)**:
    ```sql
    bucket_id = 'videos' AND auth.uid() IS NOT NULL
    ```
  - **SELECT (Read)**:
    ```sql
    bucket_id = 'videos'
    ```
  - **DELETE**:
    ```sql
    bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]
    ```

---

## 📊 Database Schema

The application uses a PostgreSQL table `jobs` in the `public` schema.

```sql
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text,
  video_url text NOT NULL,
  subtitle_file text NOT NULL,
  output_video text,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'processing', 'ready', 'done', 'failed')),
  error_message text,
  subtitle_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance Indices
CREATE INDEX jobs_user_id_idx ON public.jobs (user_id);
CREATE INDEX jobs_status_idx ON public.jobs (status);
CREATE INDEX jobs_created_at_idx ON public.jobs (created_at DESC);
```

---

## 🔒 Security & RLS Model (Server Actions)

### The RLS Mismatch Problem
Attempting to insert new job records directly from the client using a public anon client causes Row Level Security (RLS) checks like `WITH CHECK (auth.uid() = user_id)` to fail. This happens because the client sends `user_id` inside the payload, but the anon-authenticated request does not bind it correctly during query generation, throwing a `new row violates row-level security policy` error.

### The Solution: Next.js Server Actions
To resolve this, SubSync AI utilizes secure, server-side database mutations. In [`lib/actions/jobs.ts`](./lib/actions/jobs.ts), the server client initializes a server-controlled context:

```typescript
'use server';
// Run execution directly on the Node.js server environment

export async function createJob(title: string, videoUrl: string, subtitleFile: string, subtitleSettings: SubtitleSettings) {
  const supabase = await createClient(); // Server-side authenticated client
  const { data: { user } } = await supabase.auth.getUser(); // Secure extraction from request token
  
  if (!user) throw new Error("Unauthorized");

  return await supabase.from('jobs').insert({
    user_id: user.id, // Server sets the field directly, preventing manipulation
    title,
    video_url: videoUrl,
    subtitle_file: subtitleFile,
    subtitle_settings: subtitleSettings,
    status: 'ready'
  });
}
```

---

## 🌐 API Reference

### 1. `POST /api/process-video`
*Health Check & Background worker pipeline starter.*
- **Request Body**:
  ```json
  {
    "jobId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Job created successfully. Subtitles are ready for playback."
  }
  ```

### 2. `DELETE /api/jobs/delete`
*Deletes database metadata and deletes corresponding storage files in both subtitles and videos buckets.*
- **Headers**:
  - `Authorization: Bearer <user_jwt_token>` (Mandatory)
- **Request Body**:
  ```json
  {
    "jobId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "deletedJobId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "deletedStorageObjects": [
        { "bucket": "subtitles", "path": "user-uuid/file.vtt" }
      ],
      "missingStorageObjects": []
    }
  }
  ```

---

## 🚀 Deployment Guide

### Option 1: Next.js on Vercel + Separate Backend Worker (Recommended)
1. **Frontend Deployment**:
   - Push code to GitHub and import the project to [Vercel](https://vercel.com).
   - Set env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. **Worker Deployment** (Required only for legacy FFmpeg burning):
   - Set up an Express/Node worker on [Railway](https://railway.app) or [Render](https://render.com).
   - Install FFmpeg and yt-dlp in the worker's environment (or deploy using a Dockerfile container).
   - Point your API calls from the Vercel app to the worker's URL.

### Option 2: Full Server Monolithic Deployment (Dockerized)
Deploy the full app with Next.js and system tools on a single instance:
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg python3 py3-pip && pip3 install yt-dlp
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 🔧 Troubleshooting

### Subtitles fail to render in browser player
- **CORS Configuration**: The host provider of the direct video URL must output CORS headers (`Access-Control-Allow-Origin: *`). Check the browser console for CORS policy errors.
- **Private Subtitle Files**: Ensure you fetch public signed URLs from Supabase Storage for private files, or configure RLS storage policies correctly.

### FFmpeg not found during local execution
- Double-check that your installation path is included in your system's environmental variable path. Test by running `ffmpeg -version` in your terminal.

---

## 📋 Post-Deployment Checklist

- [ ] Supabase migrations applied to production database.
- [ ] `subtitles` and `videos` storage buckets initialized with correct access levels.
- [ ] Storage policies for INSERT, SELECT, UPDATE, and DELETE copied and ran.
- [ ] Vercel/Railway environment variables set.
- [ ] Authentication flows (Sign up, login, route protections) tested.
- [ ] Job deletion API verified (ensure it cleans both database rows and storage records).

---

## 📄 License & Support

Distributed under the **MIT License**.

For custom help or requests, open an issue in the project's repository.
