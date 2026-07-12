import dynamic from 'next/dynamic';
import { AlertCircle, CheckCircle2, Download, Loader2, Video, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Job, SubtitleSettings } from '@/lib/types/database';
import { cn } from '@/lib/utils';

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="video-player-container flex items-center justify-center bg-slate-950 rounded-xl border border-border/40 aspect-video">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Initializing video engine...</span>
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
  return job?.title?.trim() || 'Untitled Video Project';
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
    <Card className="surface-panel transition-all duration-200 hover:border-border overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              Realtime Studio Preview
            </CardTitle>
            <CardDescription className="mt-1">
              {currentJob ? getDisplayTitle(currentJob) : 'Complete upload and style steps to initialize live playback.'}
            </CardDescription>
          </div>
          {activeStatus && (
            <Badge variant="outline" className={cn("px-3 py-1 font-semibold rounded-full shadow-xs text-xs", activeStatus.className)}>
              {currentJob?.status === 'processing' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {currentJob?.status === 'done' && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-success" />}
              {currentJob?.status === 'failed' && <AlertCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" />}
              {activeStatus.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="space-y-2 rounded-xl bg-background/50 p-3.5 border border-border/50">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">{uploading ? queueLabel : activeStatus?.label ?? 'Awaiting source input'}</span>
            <span className="font-mono text-foreground">{displayedProgress}%</span>
          </div>
          <Progress value={displayedProgress} className="h-2 rounded-full" />
        </div>

        {currentJob ? (
          <div className="space-y-4 animate-fade-up">
            {(currentJob.status === 'ready' || currentJob.status === 'done') && (
              <>
                {subtitleUrlLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/40 px-3 py-2 rounded-lg">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Synchronizing subtitle track with storage...</span>
                  </div>
                )}
                <div className="rounded-xl overflow-hidden shadow-panel border border-border/40">
                  <VideoPlayer
                    src={currentJob.video_url}
                    subtitleUrl={subtitlePlaybackUrl}
                    subtitleSettings={settings}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 font-semibold shadow-xs hover:bg-accent"
                  onClick={() => onCopyLink(currentJob.subtitle_file)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Copy Subtitle Track Asset URL
                </Button>
              </>
            )}

            {currentJob.status === 'failed' && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 animate-scale-in">
                <div className="flex items-center gap-2 font-semibold text-destructive text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  Processing Job Failed
                </div>
                {currentJob.error_message && (
                  <p className="mt-2 text-xs font-mono text-destructive-foreground/80 bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    {currentJob.error_message}
                  </p>
                )}
              </div>
            )}

            {!['ready', 'done', 'failed'].includes(currentJob.status) && (
              <div className="glass-panel flex items-center gap-4 p-6 text-center justify-center flex-col min-h-[220px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse-glow">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">Rendering video preview</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    Realtime updates will appear here automatically via Supabase subscription as the job processes.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border/60 bg-background/30 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <Video className="h-7 w-7" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">No active studio preview</p>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
              Configure your source video and drop subtitle files above to initiate immediate live preview rendering.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
