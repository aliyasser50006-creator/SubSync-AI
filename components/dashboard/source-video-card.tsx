import { AlertCircle, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SourceVideoCardProps {
  title: string;
  titleError: string | null;
  videoUrl: string;
  videoUrlError: string | null;
  onTitleChange: (value: string) => void;
  onVideoUrlChange: (value: string) => void;
}

export function SourceVideoCard({
  title,
  titleError,
  videoUrl,
  videoUrlError,
  onTitleChange,
  onVideoUrlChange,
}: SourceVideoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Source Video
        </CardTitle>
        <CardDescription>Add a title and paste any supported video URL.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="videoTitle">Video Title</Label>
          <Input
            id="videoTitle"
            type="text"
            placeholder="Product demo - April release"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            aria-invalid={!!titleError}
          />
          {titleError && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {titleError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl">Video URL</Label>
          <Input
            id="videoUrl"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
            aria-invalid={!!videoUrlError}
          />
          {videoUrlError ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {videoUrlError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Supports YouTube, Vimeo, and direct video URLs.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
