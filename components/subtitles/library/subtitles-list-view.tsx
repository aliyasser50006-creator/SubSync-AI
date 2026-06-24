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

interface SubtitlesListViewProps {
  subtitles: Subtitle[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDownload: (subtitle: Subtitle) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  formatRelativeDate: (dateStr: string) => string;
}

export function SubtitlesListView({
  subtitles,
  selectedIds,
  onToggleSelect,
  onDownload,
  onDuplicate,
  onDelete,
  formatRelativeDate,
}: SubtitlesListViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleNavigate = (id: string) => {
    setPendingId(id);
    startTransition(() => router.push(`/library/subtitles/${id}`));
  };

  return (
    <div className="surface-panel divide-y divide-border/50 overflow-hidden">
      {subtitles.map((subtitle) => {
        const isNavigating = isPending && pendingId === subtitle.id;
        return (
          <div
            key={subtitle.id}
            className={`flex items-center gap-4 px-4 py-3 transition-all hover:bg-accent/30 cursor-pointer ${isNavigating ? 'opacity-70 pointer-events-none bg-accent/20' : ''}`}
            onClick={() => handleNavigate(subtitle.id)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedIds.has(subtitle.id)}
                onCheckedChange={() => onToggleSelect(subtitle.id)}
              />
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 relative">
              {isNavigating ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <SubtitlesIcon className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-[2]">
              <p className="truncate text-sm font-medium" title={subtitle.title}>{subtitle.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="uppercase font-semibold">{subtitle.format} Subtitle</span>
                <span>·</span>
                <span>{formatBytes(subtitle.size)}</span>
              </div>
            </div>
            
            <div className="hidden md:flex flex-col min-w-0 flex-[1.5] px-2 text-xs">
              <p className="text-muted-foreground capitalize">Status: {subtitle.job_status || 'Ready'}</p>
            </div>

            <div className="hidden lg:flex flex-col gap-0.5 text-xs text-muted-foreground w-32 items-end mr-4">
              <span>{new Date(subtitle.created_at).toLocaleDateString()}</span>
              <span className="text-[10px]">{formatRelativeDate(subtitle.created_at)}</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
        );
      })}
    </div>
  );
}
