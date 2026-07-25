'use client';

import { Play } from 'lucide-react';

import { BrowseVideo } from '@/lib/types/video-browser';

interface VideoCardProps {
  video: BrowseVideo;
  isActive: boolean;
  onSelect: (video: BrowseVideo) => void;
}

export function VideoCard({ video, isActive, onSelect }: VideoCardProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${isActive
          ? 'border-primary/45 bg-primary/10 text-foreground shadow-soft'
          : 'border-border/60 bg-background/45 text-foreground hover:border-primary/30 hover:bg-accent/50'
        }`}
      onClick={() => onSelect(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(video);
        }
      }}
    >
      <span className="line-clamp-2">{video.name}</span>
      <div className="flex items-center gap-2 text-xs">
        {isActive && <span className="font-medium text-primary">Playing</span>}
        <Play className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}
