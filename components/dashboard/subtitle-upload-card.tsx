import { UploadCloud, X, FileText, CheckCircle2 } from 'lucide-react';
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
    <Card className="surface-panel transition-all duration-200 hover:border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            <UploadCloud className="h-4 w-4" />
          </div>
          Subtitle Upload
        </CardTitle>
        <CardDescription>Drag and drop SRT subtitle files or browse from your device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            'group relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
            isDragging
              ? 'border-primary bg-primary/10 shadow-sm scale-[0.99]'
              : 'border-border/60 bg-background/50 hover:border-primary/50 hover:bg-primary/5'
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
            <div className={cn(
              "mx-auto flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            )}>
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              Drop SRT files here or <span className="text-primary underline underline-offset-4">click to browse</span>
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Batch upload creates one job per subtitle file automatically.
            </p>
          </label>
        </div>

        {subtitleFiles.length > 0 && (
          <div className="space-y-2 pt-2 animate-fade-in">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Queued Files ({subtitleFiles.length})
              </span>
            </div>
            <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1">
              {subtitleFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs transition-all duration-150 hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRemoveFile(file)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
