'use client';

import { useMemo, useState } from 'react';
import { FileText, Loader2, Search, X, Sparkles, Clock } from 'lucide-react';
import { useSubtitleParser } from '@/hooks/use-subtitle-parser';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface SubtitlePanelProps {
  subtitleUrl: string | null;
  onSeekTo: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SubtitlePanel({ subtitleUrl, onSeekTo }: SubtitlePanelProps) {
  const { cues, loading, error } = useSubtitleParser(subtitleUrl);
  const [search, setSearch] = useState('');

  const filteredCues = useMemo(() => {
    if (!search.trim()) return cues;
    const term = search.toLowerCase();
    return cues.filter(c => c.text.toLowerCase().includes(term));
  }, [cues, search]);

  if (!subtitleUrl) return null;

  if (loading) {
    return (
      <div className="surface-panel p-10 flex flex-col items-center justify-center text-muted-foreground mt-6 border border-border/60">
        <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium text-foreground">Parsing subtitle transcript...</p>
        <p className="text-xs text-muted-foreground mt-1">Extracting timestamps and cue blocks</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-panel p-6 border-destructive/30 bg-destructive/10 text-destructive mt-6">
        <p className="text-sm font-bold">Could not load transcript</p>
        <p className="text-xs mt-1 font-mono opacity-90">{error}</p>
      </div>
    );
  }

  if (cues.length === 0) return null;

  return (
    <div className="surface-panel flex flex-col mt-6 overflow-hidden max-h-[560px]">
      <div className="p-4 sm:px-6 border-b border-border/40 flex flex-wrap items-center justify-between gap-4 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground leading-none">Interactive Transcript</h3>
            <p className="text-xs text-muted-foreground mt-1">Click any cue timestamp to jump directly in playback</p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs bg-background/50 px-2.5 py-1">
          {cues.length} total cues
        </Badge>
      </div>

      <div className="p-3 sm:px-6 border-b border-border/40 bg-muted/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter cues by spoken text..."
            className="pl-9 h-9 text-sm bg-background/80 shadow-xs focus-visible:border-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3 sm:px-6 py-4">
        {filteredCues.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground font-mono">
            No spoken transcript matches found for query "{search}"
          </div>
        ) : (
          <div className="space-y-2 pr-3">
            {filteredCues.map((cue) => (
              <button
                key={cue.id}
                onClick={() => onSeekTo(cue.start)}
                className="w-full text-left p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-accent/60 hover:border-primary/40 transition-all group flex gap-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 px-2.5 py-1 rounded-md text-primary font-mono text-xs font-semibold shadow-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Clock className="h-3 w-3 opacity-70" />
                  <span>{formatTime(cue.start)}</span>
                </div>
                <span className="text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans pt-0.5 group-hover:text-foreground">
                  {cue.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
