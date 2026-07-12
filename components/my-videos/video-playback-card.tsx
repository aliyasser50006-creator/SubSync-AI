import dynamic from 'next/dynamic';
import { AlertCircle, FileVideo, Loader2, PlayCircle, Subtitles, Sparkles } from 'lucide-react';
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
    <div className="aspect-video w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center border border-border/40 shadow-soft">
      <Loader2 className="h-7 w-7 animate-spin text-primary mb-2.5" />
      <span className="text-xs font-semibold text-foreground">Loading preview player...</span>
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
    case 'ready':
      return 'border-success/30 bg-success/15 text-success font-semibold';
    case 'processing':
    case 'pending':
      return 'border-primary/30 bg-primary/15 text-primary font-semibold animate-pulse';
    case 'failed':
      return 'border-destructive/30 bg-destructive/15 text-destructive font-semibold';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

function getStatusIcon(status: Job['status']) {
  if (status === 'processing') return <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />;
  if (status === 'failed') return <AlertCircle className="mr-1.5 h-3.5 w-3.5" />;
  if (status === 'ready' || status === 'done') return <Subtitles className="mr-1.5 h-3.5 w-3.5" />;
  return <PlayCircle className="mr-1.5 h-3.5 w-3.5" />;
}

export function VideoPlaybackCard({
  selectedJob,
  playerUrl,
  subtitleUrlLoading,
  selectedSubtitleUrl,
  playRequestId,
}: VideoPlaybackCardProps) {
  return (
    <div className="surface-panel h-fit xl:sticky xl:top-6 border border-border/60 shadow-elevated p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="h-3 w-3" /> Live Workstation Preview
          </div>
          <h3 className="text-base font-bold text-foreground">
            {selectedJob ? (selectedJob.title?.trim() || 'Untitled Video') : 'No Video Selected'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedJob ? 'Instant playback with real-time subtitle sync' : 'Select any job from the workspace table'}
          </p>
        </div>
        {selectedJob && (
          <Badge variant="outline" className={cn(getStatusColor(selectedJob.status), 'capitalize px-2.5 py-1 text-xs shrink-0')}>
            {getStatusIcon(selectedJob.status)}
            {selectedJob.status}
          </Badge>
        )}
      </div>

      <div>
        {selectedJob && playerUrl ? (
          <div className="space-y-3">
            {subtitleUrlLoading && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Retrieving subtitle track...
              </div>
            )}

            {!selectedJob.subtitle_file?.trim() && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs font-medium text-warning">
                No subtitle file generated for this job record yet.
              </div>
            )}

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-border/40 shadow-soft">
              <VideoPlayer
                key={`my-videos-player-${selectedJob.id}-${selectedJob.video_url}`}
                src={playerUrl}
                playRequestId={playRequestId}
                subtitleUrl={selectedSubtitleUrl}
                subtitleSettings={selectedJob.subtitle_settings || DEFAULT_SUBTITLE_SETTINGS}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/40 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
              <FileVideo className="h-7 w-7" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Select a project to inspect</h4>
            <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
              Click on any video row in your workspace to trigger interactive preview and subtitle verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
