import dynamic from 'next/dynamic';
import { AlertCircle, FileVideo, Loader2, PlayCircle, Subtitles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Job, SubtitleSettings } from '@/lib/types/database';
import { cn } from '@/lib/utils';

const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 28,
  fontColor: '#FFFFFF',
  position: 'bottom',
  alignment: 'center',
  background: false,
  outlineColor: '#000000',
  outlineWidth: 2,
};

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="video-player-container">
      <div className="video-player-overlay">
        <Loader2 className="video-player-spinner" />
      </div>
    </div>
  ),
});

interface VideoPlaybackCardProps {
  selectedJob: Job | null;
  playerUrl: string | null;
  subtitleUrlLoading: boolean;
  selectedSubtitleUrl: string | null;
  playRequestId: number;
}

function getStatusColor(status: Job['status']): string {
  switch (status) {
    case 'done':
      return 'border-success/25 bg-success/10 text-success';
    case 'processing':
      return 'border-primary/25 bg-primary/10 text-primary';
    case 'failed':
      return 'border-destructive/25 bg-destructive/10 text-destructive';
    case 'ready':
      return 'border-primary/25 bg-primary/10 text-primary';
    case 'pending':
      return 'border-warning/25 bg-warning/10 text-warning';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

function getStatusIcon(status: Job['status']) {
  if (status === 'processing') return <Loader2 className="mr-1 h-3 w-3 animate-spin" />;
  if (status === 'failed') return <AlertCircle className="mr-1 h-3 w-3" />;
  if (status === 'ready') return <Subtitles className="mr-1 h-3 w-3" />;
  return <PlayCircle className="mr-1 h-3 w-3" />;
}

export function VideoPlaybackCard({
  selectedJob,
  playerUrl,
  subtitleUrlLoading,
  selectedSubtitleUrl,
  playRequestId,
}: VideoPlaybackCardProps) {
  return (
    <Card className="h-fit xl:sticky xl:top-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Playback</CardTitle>
            <CardDescription>
              {selectedJob ? (selectedJob.title?.trim() || 'Untitled video') : 'Select a video from the list'}
            </CardDescription>
          </div>
          {selectedJob && (
            <Badge variant="outline" className={cn(getStatusColor(selectedJob.status), 'capitalize')}>
              {getStatusIcon(selectedJob.status)}
              {selectedJob.status}
            </Badge>
          )}
        </div>
        {selectedJob && <p className="truncate text-xs text-muted-foreground">{selectedJob.video_url}</p>}
      </CardHeader>
      <CardContent>
        {selectedJob && playerUrl ? (
          <div className="space-y-3">
            {subtitleUrlLoading && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading subtitles...
              </p>
            )}

            {!selectedJob.subtitle_file?.trim() && (
              <p className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
                No subtitle file saved for this record.
              </p>
            )}

            <VideoPlayer
              key={`my-videos-player-${selectedJob.id}-${selectedJob.video_url}`}
              src={playerUrl}
              playRequestId={playRequestId}
              subtitleUrl={selectedSubtitleUrl}
              subtitleSettings={selectedJob.subtitle_settings || DEFAULT_SUBTITLE_SETTINGS}
            />
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/45 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <FileVideo className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-base font-medium">No video selected</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Choose a video from your library to view the preview, manage subtitles, or download the processed file.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
