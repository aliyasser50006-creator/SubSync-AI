import dynamic from 'next/dynamic';
import { AlertCircle, CheckCircle2, Download, Loader2, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Job, SubtitleSettings } from '@/lib/types/database';

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

interface ActiveStatus {
  label: string;
  progress: number;
  className: string;
}

interface LivePreviewCardProps {
  currentJob: Job | null;
  activeStatus: ActiveStatus | null;
  uploading: boolean;
  queueLabel: string;
  displayedProgress: number;
  subtitleUrlLoading: boolean;
  subtitlePlaybackUrl: string | null;
  settings: SubtitleSettings;
  onCopyLink: (path: string) => void;
}

function getDisplayTitle(job: Job | null) {
  return job?.title?.trim() || 'Untitled video';
}

export function LivePreviewCard({
  currentJob,
  activeStatus,
  uploading,
  queueLabel,
  displayedProgress,
  subtitleUrlLoading,
  subtitlePlaybackUrl,
  settings,
  onCopyLink,
}: LivePreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              {currentJob ? getDisplayTitle(currentJob) : 'Create a job to preview captions.'}
            </CardDescription>
          </div>
          {activeStatus && (
            <Badge variant="outline" className={activeStatus.className}>
              {currentJob?.status === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {currentJob?.status === 'done' && <CheckCircle2 className="mr-1 h-3 w-3" />}
              {currentJob?.status === 'failed' && <AlertCircle className="mr-1 h-3 w-3" />}
              {activeStatus.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{uploading ? queueLabel : activeStatus?.label ?? 'Waiting for input'}</span>
            <span>{displayedProgress}%</span>
          </div>
          <Progress value={displayedProgress} />
        </div>

        {currentJob ? (
          <div className="space-y-4">
            {(currentJob.status === 'ready' || currentJob.status === 'done') && (
              <>
                {subtitleUrlLoading && (
                  <p className="text-xs text-muted-foreground">Loading subtitle track...</p>
                )}
                <VideoPlayer
                  src={currentJob.video_url}
                  subtitleUrl={subtitlePlaybackUrl}
                  subtitleSettings={settings}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => onCopyLink(currentJob.subtitle_file)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Copy Subtitle Link
                </Button>
              </>
            )}

            {currentJob.status === 'failed' && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <div className="flex items-center gap-2 font-medium text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Processing failed
                </div>
                {currentJob.error_message && (
                  <p className="mt-2 text-sm text-muted-foreground">{currentJob.error_message}</p>
                )}
              </div>
            )}

            {!['ready', 'done', 'failed'].includes(currentJob.status) && (
              <div className="subtle-panel flex items-center gap-3 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">Preparing preview</p>
                  <p className="text-xs text-muted-foreground">
                    Realtime updates will appear here as the job changes.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background/45 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Video className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium">No active preview</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete the source, subtitle, and styling steps to start.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
