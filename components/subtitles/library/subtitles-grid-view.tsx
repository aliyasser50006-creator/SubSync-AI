import { Subtitles as SubtitlesIcon, MoreHorizontal, Download, Copy, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Subtitle } from '@/lib/types/database';
import { formatBytes } from '@/lib/utils/format';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SubtitlesGridViewProps {
  subtitles: Subtitle[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDownload: (subtitle: Subtitle) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  formatRelativeDate: (dateStr: string) => string;
}

export function SubtitlesGridView({
  subtitles,
  selectedIds,
  onToggleSelect,
  onDownload,
  onDuplicate,
  onDelete,
  formatRelativeDate,
}: SubtitlesGridViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleNavigate = (id: string) => {
    setPendingId(id);
    startTransition(() => router.push(`/library/subtitles/${id}`));
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {subtitles.map((subtitle) => {
        const isNavigating = isPending && pendingId === subtitle.id;
        return (
          <div
            key={subtitle.id}
            className={`surface-panel interactive-card group relative cursor-pointer overflow-hidden p-5 flex flex-col h-full transition-opacity ${isNavigating ? 'opacity-70 pointer-events-none' : ''}`}
            onClick={() => handleNavigate(subtitle.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(subtitle.id)}
                  onCheckedChange={() => onToggleSelect(subtitle.id)}
                  className="mt-0.5"
                />
                <div className="relative flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {isNavigating ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <SubtitlesIcon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 rounded bg-foreground/80 px-1 text-[9px] font-bold text-background uppercase">
                    {subtitle.format}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground mb-1">
                    File: {subtitle.title}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate(subtitle.id)}>
                    Open Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDownload(subtitle)}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(subtitle.id)}>
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(subtitle.id)}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 flex-1">
              <h3 className="line-clamp-2 font-semibold text-lg leading-snug break-words min-h-[56px]" title={subtitle.title}>
                {subtitle.title}
              </h3>
              <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <span className="uppercase font-medium">{subtitle.format} Subtitle</span>
                  <span>·</span>
                  <span>{formatBytes(subtitle.size)}</span>
                </p>
                <p>Uploaded {formatRelativeDate(subtitle.created_at)}</p>
                <p className="capitalize">Status: {subtitle.job_status || 'Ready'}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
