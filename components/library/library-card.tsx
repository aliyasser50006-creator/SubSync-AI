'use client';

import { memo, useTransition } from 'react';

import { useRouter } from 'next/navigation';
import { Loader2, Play, Subtitles, Clock, AlertTriangle } from 'lucide-react';
import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { VideoThumbnail } from '@/components/videos/video-thumbnail';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LibraryCardProps {
  video: BrowseVideo & { status?: Job['status'] };
}

function getStatusBadge(status?: Job['status']) {
  switch (status) {
    case 'done':
    case 'ready':
      return <Badge variant="outline" className="border-success/25 bg-success/10 text-success text-[10px] px-1.5 py-0">Ready</Badge>;
    case 'processing':
    case 'pending':
      return <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary text-[10px] px-1.5 py-0 animate-pulse">Processing</Badge>;
    case 'failed':
      return <Badge variant="outline" className="border-destructive/25 bg-destructive/10 text-destructive text-[10px] px-1.5 py-0"><AlertTriangle className="w-3 h-3 mr-1"/> Failed</Badge>;
    default:
      return null;
  }
}

export const LibraryCard = memo(function LibraryCard({ video }: LibraryCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formattedDate = video.created_at 
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(video.created_at))
    : 'Unknown date';

  return (
    <button
      onClick={() => startTransition(() => router.push(`/library/${video.id}`))}
      disabled={isPending}
      className="group relative flex flex-col w-full text-left rounded-xl border border-border/60 bg-card overflow-hidden interactive-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 disabled:pointer-events-none transition-opacity"
      aria-label={`View video details for ${video.name}`}
    >
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        <VideoThumbnail 
          title={video.name} 
          url={video.video_url} 
          iconClassName="h-8 w-8"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Play overlay hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center pl-1 backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform duration-200">
            {isPending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Play fill="white" className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
          {getStatusBadge(video.status)}
          {video.subtitle_file && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border-transparent text-[10px] px-1.5 py-0 text-foreground/80 shadow-sm">
              <Subtitles className="w-3 h-3 mr-1" /> CC
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[40px]" title={video.name}>
          {video.name}
        </h3>
        
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="truncate">{formattedDate}</span>
          </div>
        </div>
      </div>
    </button>
  );
});
