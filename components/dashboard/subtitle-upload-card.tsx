import { UploadCloud, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface SubtitleUploadCardProps {
  subtitleFiles: File[];
  isDragging: boolean;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveFile: (file: File) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function SubtitleUploadCard({
  subtitleFiles,
  isDragging,
  onAddFiles,
  onRemoveFile,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: SubtitleUploadCardProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddFiles(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" />
          Subtitle Upload
        </CardTitle>
        <CardDescription>Drag in multiple SRT files or browse from your device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            'rounded-lg border border-dashed p-8 text-center transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
            isDragging
              ? 'border-primary bg-primary/10 shadow-glow'
              : 'border-border bg-background/45 hover:border-primary/45 hover:bg-primary/5'
          )}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept=".srt"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="subtitle-upload"
          />
          <label htmlFor="subtitle-upload" className="block cursor-pointer">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium">Drop SRT files here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">Batch upload creates one job per subtitle file.</p>
          </label>
        </div>

        {subtitleFiles.length > 0 && (
          <div className="grid gap-2">
            {subtitleFiles.map((file) => (
              <div
                key={`${file.name}-${file.size}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/45 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemoveFile(file)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
