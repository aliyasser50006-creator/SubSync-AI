'use client';

import { MouseEvent } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Loader2, Play, Subtitles } from 'lucide-react';
import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { buildLibraryVideoUrl } from '@/lib/utils/library-video-route';
import { cn } from '@/lib/utils';

type LibraryListVideo = BrowseVideo & { status?: Job['status'] };

interface LibraryListViewProps {
  videos: LibraryListVideo[];
  onBeforeOpen: (video: LibraryListVideo) => boolean;
}

function getStatusBadge(status?: Job['status']) {
  switch (status) {
    case 'done':
    case 'ready':
      return <Badge variant="outline" className="border-success/25 bg-success/10 text-success text-xs px-2 py-0.5 font-medium"><CheckCircle2 className="mr-1 h-3 w-3" /> Ready</Badge>;
    case 'processing':
    case 'pending':
      return <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary text-xs px-2 py-0.5 font-medium animate-pulse"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing</Badge>;
    case 'failed':
      return <Badge variant="outline" className="border-destructive/25 bg-destructive/10 text-destructive text-xs px-2 py-0.5 font-medium"><AlertTriangle className="mr-1 h-3 w-3" /> Failed</Badge>;
    default:
      return null;
  }
}

export function LibraryListView({ videos, onBeforeOpen }: LibraryListViewProps) {
  return (
    <div className="surface-panel overflow-hidden border border-border/60">
      <div className="grid grid-cols-[1fr_120px_160px_120px] gap-4 border-b border-border/60 bg-muted/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Video Project</div><div>Status</div><div>Created Date</div><div className="text-right">Actions</div>
      </div>
      <div className="divide-y divide-border/40">
        {videos.map((video) => {
          const detailsUrl = buildLibraryVideoUrl(video.id) || '#';
          const formattedDate = video.created_at
            ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(video.created_at))
            : 'Unknown';
          const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
            if (!onBeforeOpen(video)) event.preventDefault();
          };

          return (
            <a
              key={video.id}
              href={detailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="group grid grid-cols-[1fr_120px_160px_120px] items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              aria-label={`Open details for ${video.name} in a new tab`}
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-950 text-primary shadow-xs"><Play className="h-4 w-4 fill-current" /></div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary" title={video.name}>{video.name}</h4>
                  {video.subtitle_file && <span className="mt-0.5 inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"><Subtitles className="mr-1 h-3 w-3 text-primary" /> CC Attached</span>}
                </div>
              </div>
              <div>{getStatusBadge(video.status)}</div>
              <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 shrink-0" /><span>{formattedDate}</span></div>
              <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto h-8 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors')}>
                View Details <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
