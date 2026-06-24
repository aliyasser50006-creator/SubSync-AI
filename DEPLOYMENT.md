# Deployment Guide

This guide covers deploying SubSync AI to production.

## Prerequisites

- Supabase project configured
- Environment variables ready
- Server with FFmpeg and yt-dlp (for video processing)

## Option 1: Vercel + Separate Worker (Recommended)

### Vercel Setup

1. **Connect Repository**

   ```bash
   # Push to GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Configure project:
     - Framework: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Your frontend will be live!

### Separate Worker for Video Processing

Since Vercel serverless functions have limitations, use a separate worker:

**Option A: Railway**

1. Create a new project on [Railway](https://railway.app)
2. Deploy this worker code:

```javascript
// worker/index.js
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

app.post("/process", async (req, res) => {
  const { jobId } = req.body;
  res.json({ success: true, message: "Processing started" });

  // Process video asynchronously
  processVideo(jobId).catch(console.error);
});

async function processVideo(jobId) {
  // Your video processing logic here
  // Same as in /app/api/process-video/route.ts
}

app.listen(3001, () => {
  console.log("Worker running on port 3001");
});
```

3. Set environment variables on Railway
4. Update your Vercel API route to call the worker:

```typescript
// app/api/process-video/route.ts
export async function POST(request: Request) {
  const { jobId } = await request.json();

  await fetch(process.env.WORKER_URL + "/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  });

  return NextResponse.json({ success: true });
}
```

**Option B: DigitalOcean Droplet**

1. Create a droplet with Ubuntu
2. Install dependencies:
   ```bash
   sudo apt update
   sudo apt install nodejs npm ffmpeg python3-pip
   pip3 install yt-dlp
   ```
3. Deploy your worker code
4. Use PM2 to keep it running:
   ```bash
   npm install -g pm2
   pm2 start worker/index.js
   pm2 startup
   pm2 save
   ```

## Option 2: Full Server Deployment (Railway/Render/DO)

Deploy the entire Next.js app with video processing included.

### Railway

1. Connect your GitHub repo
2. Add environment variables
3. Add start command: `npm run build && npm start`
4. Install FFmpeg in Dockerfile:

```dockerfile
FROM node:18-alpine

RUN apk add --no-cache ffmpeg python3 py3-pip
RUN pip3 install yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

CMD ["npm", "start"]
```

### Render

1. Create a new Web Service
2. Connect your repository
3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables
5. Add build script to install FFmpeg (Render uses Docker)

### DigitalOcean App Platform

1. Create a new app
2. Connect your GitHub repo
3. Add environment variables
4. Configure build command
5. Note: May need custom buildpack for FFmpeg

## Option 3: AWS (Advanced)

### Architecture

- **Frontend**: Next.js on Vercel or Amplify
- **Worker**: Lambda + EFS (for FFmpeg layer)
- **Queue**: SQS for job processing
- **Storage**: S3 (instead of Supabase Storage)

### Steps

1. Create Lambda function with FFmpeg layer
2. Set up SQS queue
3. Configure S3 buckets
4. Deploy Next.js to Amplify
5. Connect everything with API Gateway

## Post-Deployment Checklist

- [ ] Supabase database migration applied
- [ ] Storage buckets created (subtitles, videos)
- [ ] Storage policies configured
- [ ] Environment variables set
- [ ] FFmpeg installed on worker
- [ ] yt-dlp installed on worker
- [ ] Test video upload
- [ ] Test video processing
- [ ] Test video playback
- [ ] Test authentication flow
- [ ] Monitor error logs

## Monitoring

### Supabase Dashboard

- Monitor database queries
- Check storage usage
- View auth logs

### Application Logs

- Check Vercel/Railway logs for errors
- Monitor video processing failures

### Performance

- Set up Sentry or LogRocket for error tracking
- Monitor API response times
- Track video processing duration

## Scaling Considerations

### Database

- Index on `user_id` and `status` (already created)
- Consider archiving old jobs

### Storage

- Monitor storage costs
- Implement retention policies
- Consider CDN for video delivery

### Processing

- Use job queue for better reliability
- Add retry logic for failed jobs
- Consider parallel processing for multiple videos

## Cost Estimates

### Supabase (Free Tier)

- Database: Free up to 500MB
- Storage: Free up to 1GB
- Bandwidth: Free up to 2GB

### Vercel (Hobby)

- Hosting: Free
- Bandwidth: 100GB/month
- Serverless: 100GB-hrs

### Railway (Starter)

- $5/month credit
- Pay for what you use

### Total Estimated Cost

- Small scale: $0-$10/month
- Medium scale: $20-$50/month
- Large scale: $100+/month

## Troubleshooting

### Build Fails

- Check Node.js version (18+)
- Verify all dependencies installed
- Check TypeScript errors

### Video Processing Fails

- Verify FFmpeg installed: `ffmpeg -version`
- Verify yt-dlp installed: `yt-dlp --version`
- Check temp directory permissions
- Monitor RAM usage (videos need memory)

### Authentication Issues

- Verify Supabase URL and keys
- Check CORS settings in Supabase
- Verify redirect URLs configured

### Storage Issues

- Check bucket policies
- Verify file size limits
- Monitor storage quota

## Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Add `.env.local` to `.gitignore`

2. **Enable RLS**
   - All database tables should have RLS
   - Test policies thoroughly

3. **Validate inputs**
   - Check file types (.srt only)
   - Validate URLs
   - Sanitize user inputs

4. **Rate limiting**
   - Implement API rate limits
   - Prevent abuse

5. **Monitor usage**
   - Track processing costs
   - Set up alerts

## Support

For deployment issues:

1. Check application logs
2. Review Supabase logs
3. Consult platform documentation
4. Open an issue on GitHub
