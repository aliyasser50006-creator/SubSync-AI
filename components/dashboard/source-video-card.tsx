import { AlertCircle, Video, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SourceVideoCardProps {
  title: string;
  titleError: string | null;
  videoUrl: string;
  videoUrlError: string | null;
  imgUrl?: string;
  imgUrlError?: string | null;
  onTitleChange: (value: string) => void;
  onVideoUrlChange: (value: string) => void;
  onImgUrlChange?: (value: string) => void;
}

export function SourceVideoCard({
  title,
  titleError,
  videoUrl,
  videoUrlError,
  imgUrl = '',
  imgUrlError = null,
  onTitleChange,
  onVideoUrlChange,
  onImgUrlChange,
}: SourceVideoCardProps) {
  const isValidUrl = videoUrl.trim() !== '' && !videoUrlError;
  const isValidImgUrl = imgUrl.trim() !== '' && !imgUrlError;

  return (
    <Card variant="surface" className="transition-all duration-200 hover:border-primary/40 shadow-xs group">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-title font-bold text-foreground">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <span>Source Video</span>
          </div>
        </CardTitle>
        <CardDescription className="text-body text-muted-foreground pt-0.5">
          Add a descriptive project title and paste a supported video or media URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-1">
        <div className="space-y-2">
          <Label htmlFor="videoTitle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Video Title
          </Label>
          <Input
            id="videoTitle"
            type="text"
            placeholder="e.g. Product Demo — Keynote 2026"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            aria-invalid={!!titleError}
            className={cn(
              "h-10 rounded-lg bg-background/60 transition-all font-medium text-sm",
              titleError ? "border-destructive focus-visible:ring-destructive/30" : "focus-visible:border-primary"
            )}
          />
          {titleError && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive animate-fade-in pt-0.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {titleError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Video URL
          </Label>
          <div className="relative">
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://youtube.com/watch?v=... or direct .mp4 link"
              value={videoUrl}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              aria-invalid={!!videoUrlError}
              className={cn(
                "h-10 rounded-lg bg-background/60 pr-10 transition-all font-mono text-xs",
                videoUrlError ? "border-destructive focus-visible:ring-destructive/30" : "focus-visible:border-primary"
              )}
            />
            {isValidUrl && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success animate-scale-in">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </div>
          {videoUrlError ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive animate-fade-in pt-0.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {videoUrlError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/80 leading-normal">
              Supports YouTube, Vimeo, and direct media files (.mp4, .webm, .m3u8).
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="imgUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Poster Image URL <span className="text-[10px] font-normal text-muted-foreground/70">(Optional)</span>
          </Label>
          <div className="relative">
            <Input
              id="imgUrl"
              type="url"
              placeholder="https://example.com/poster.png (.webp, .jpg, etc.)"
              value={imgUrl}
              onChange={(e) => onImgUrlChange?.(e.target.value)}
              aria-invalid={!!imgUrlError}
              className={cn(
                "h-10 rounded-lg bg-background/60 pr-10 transition-all font-mono text-xs",
                imgUrlError ? "border-destructive focus-visible:ring-destructive/30" : "focus-visible:border-primary"
              )}
            />
            {isValidImgUrl && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success animate-scale-in">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </div>
          {imgUrlError ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive animate-fade-in pt-0.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {imgUrlError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/80 leading-normal">
              Optional custom thumbnail or movie poster image URL (.png, .webp, .jpg, .avif, .gif, etc.).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
