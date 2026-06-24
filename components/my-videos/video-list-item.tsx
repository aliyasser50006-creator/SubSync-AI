import { AlertCircle, Download, Eye, Loader2, Pencil, Play, PlayCircle, RotateCcw, Subtitles, Trash2 } from 'lucide-react';
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

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Invalid URL';
  }
}

function getDisplayTitle(job: Job): string {
  return job.title?.trim() || 'Untitled video';
}

function formatDate(value: string) {
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
}: VideoListItemProps) {
  return (
    <Card className={cn('overflow-hidden interactive-card', isSelected && 'border-primary/45 shadow-glow')}>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Video Title</label>
              <Input
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                placeholder="Product demo"
              />
              {editTitleError && <p className="text-xs text-destructive">{editTitleError}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Video URL</label>
              <Input
                value={editVideoUrl}
                onChange={(e) => onEditVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
              {editVideoUrlError && <p className="text-xs text-destructive">{editVideoUrlError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSaveEdit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[148px_minmax(0,1fr)]">
            <button
              type="button"
              onClick={onSelect}
              className="relative aspect-video overflow-hidden rounded-lg bg-slate-950 text-left"
              aria-label={`Play ${getDisplayTitle(job)}`}
            >
              <VideoThumbnail title={getDisplayTitle(job)} url={job.video_url} />
              <div className="absolute inset-0 bg-black/30" />
              <PlayCircle className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white" />
            </button>

            <div className="min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{getDisplayTitle(job)}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{getHostname(job.video_url)}</p>
                </div>
                <Badge variant="outline" className={cn(getStatusColor(job.status), 'capitalize')}>
                  {getStatusIcon(job.status)}
                  {job.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(job.created_at)}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span>{job.subtitle_file ? 'Subtitle attached' : 'No subtitle'}</span>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={onSelect}
                  aria-label="Play video"
                >
                  <Play className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartEdit}
                  aria-label="Edit video"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="Delete video"
                      disabled={isDeleting}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete video</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &ldquo;{getDisplayTitle(job)}&rdquo;? This will permanently remove the database record and any associated subtitle files. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
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
                  >
                    {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  </Button>
                )}

                {job.status === 'done' && job.output_video && (
                  <>
                    <Button size="sm" variant="outline" onClick={onOpenOutput} aria-label="Open output video">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={onDownload} aria-label="Download video">
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
