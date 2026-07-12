import { AlertCircle, Download, Eye, Loader2, Pencil, Play, PlayCircle, RotateCcw, Subtitles, Trash2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Job } from '@/lib/types/database';
import { VideoThumbnail } from '@/components/videos/video-thumbnail';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VideoListItemProps {
  job: Job;
  isSelected: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isRetrying: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onRetry: () => void;
  onOpenOutput: () => void;
  editTitle: string;
  onEditTitleChange: (v: string) => void;
  editTitleError: string | null;
  editVideoUrl: string;
  onEditVideoUrlChange: (v: string) => void;
  editVideoUrlError: string | null;
  editImgUrl: string;
  onEditImgUrlChange: (v: string) => void;
  editImgUrlError: string | null;
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
      return 'border-border bg-muted text-muted-foreground font-semibold';
  }
}

function getStatusIcon(status: Job['status']) {
  if (status === 'processing') return <Loader2 className="mr-1 h-3 w-3 animate-spin" />;
  if (status === 'failed') return <AlertCircle className="mr-1 h-3 w-3" />;
  if (status === 'ready' || status === 'done') return <CheckCircle2 className="mr-1 h-3 w-3" />;
  return <PlayCircle className="mr-1 h-3 w-3" />;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Media Stream';
  }
}

function getDisplayTitle(job: Job): string {
  const title = job.title?.trim();
  if (title) return title;
  const fileName = job.subtitle_file.split('/').pop() || 'Untitled Video';
  return fileName.replace(/\.[^/.]+$/, '');
}

function formatDate(value?: string): string {
  if (!value) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function VideoListItem({
  job,
  isSelected,
  isEditing,
  isSaving,
  isDeleting,
  isRetrying,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onDownload,
  onRetry,
  onOpenOutput,
  editTitle,
  onEditTitleChange,
  editTitleError,
  editVideoUrl,
  onEditVideoUrlChange,
  editVideoUrlError,
  editImgUrl,
  onEditImgUrlChange,
  editImgUrlError,
}: VideoListItemProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-200 overflow-hidden bg-card/80 p-4 shadow-soft',
        isSelected
          ? 'border-primary/60 bg-primary/5 shadow-glow ring-1 ring-primary/40'
          : 'border-border/60 hover:border-border hover:bg-card'
      )}
    >
      {isEditing ? (
        <div className="space-y-4 p-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Video Title</label>
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              placeholder="Enter project title..."
              className="h-9 bg-background"
            />
            {editTitleError && <p className="text-xs text-destructive font-medium">{editTitleError}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Source Video URL</label>
            <Input
              value={editVideoUrl}
              onChange={(e) => onEditVideoUrlChange(e.target.value)}
              placeholder="https://..."
              className="h-9 bg-background font-mono text-xs"
            />
            {editVideoUrlError && <p className="text-xs text-destructive font-medium">{editVideoUrlError}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Poster Image URL</span>
              <span className="text-[10px] font-normal text-muted-foreground/70">(Optional)</span>
            </label>
            <Input
              value={editImgUrl}
              onChange={(e) => onEditImgUrlChange(e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="h-9 bg-background font-mono text-xs"
            />
            {editImgUrlError && <p className="text-xs text-destructive font-medium">{editImgUrlError}</p>}
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={isSaving} className="h-8 text-xs font-semibold">
              Cancel
            </Button>
            <Button size="sm" onClick={onSaveEdit} disabled={isSaving || !!editTitleError || !!editVideoUrlError || !!editImgUrlError} className="h-8 text-xs font-semibold shadow-xs">
              {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)] items-center">
          <button
            type="button"
            onClick={onSelect}
            className="group relative aspect-video overflow-hidden rounded-xl bg-slate-950 text-left border border-border/40 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Play ${getDisplayTitle(job)}`}
          >
            <VideoThumbnail title={getDisplayTitle(job)} url={job.video_url} imgUrl={job.img_url} className="transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transform scale-90 group-hover:scale-100 transition-transform">
              <Play fill="currentColor" className="h-4 w-4 ml-0.5" />
            </div>
          </button>

          <div className="min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4
                  onClick={onSelect}
                  className="truncate text-sm font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                  title={getDisplayTitle(job)}
                >
                  {getDisplayTitle(job)}
                </h4>
                <p className="mt-0.5 truncate text-xs text-muted-foreground font-mono">{getHostname(job.video_url)}</p>
              </div>
              <Badge variant="outline" className={cn(getStatusColor(job.status), 'capitalize px-2.5 py-0.5 text-xs shrink-0')}>
                {getStatusIcon(job.status)}
                {job.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-mono">
              <span>{formatDate(job.created_at)}</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              <span className={cn(job.subtitle_file ? 'text-primary font-semibold font-sans' : '')}>
                {job.subtitle_file ? '✓ Subtitle Track Ready' : 'No Subtitle Track'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-border/30">
              <Button
                size="sm"
                variant={isSelected ? 'default' : 'secondary'}
                onClick={onSelect}
                className="h-8 px-3 text-xs font-semibold shadow-xs"
                aria-label="Inspect video"
              >
                <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                Inspect
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onStartEdit}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Edit project metadata"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Delete project"
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/15 hover:text-destructive border-destructive/30"
                  >
                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete project job?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &ldquo;{getDisplayTitle(job)}&rdquo;? This will permanently erase the database record and generated subtitle track from your workspace.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Permanently Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {job.status === 'failed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="h-8 px-2.5 text-xs font-semibold text-warning border-warning/30 hover:bg-warning/10"
                >
                  {isRetrying ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
                  Retry
                </Button>
              )}

              {(job.status === 'done' || job.status === 'ready') && job.output_video && (
                <>
                  <Button size="sm" variant="outline" onClick={onOpenOutput} className="h-8 px-2.5 text-xs font-medium">
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Output
                  </Button>
                  <Button size="sm" onClick={onDownload} className="h-8 px-2.5 text-xs font-semibold shadow-xs">
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
