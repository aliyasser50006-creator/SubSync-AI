'use client';

import { useMemo, useState } from 'react';
import { FileText, Loader2, Search, X } from 'lucide-react';
import { useSubtitleParser } from '@/hooks/use-subtitle-parser';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <div className="subtle-panel p-8 flex flex-col items-center justify-center text-muted-foreground mt-6">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p className="text-sm">Loading subtitle transcript...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subtle-panel p-6 border-warning/30 bg-warning/5 text-warning mt-6">
        <p className="text-sm font-medium">Could not load transcript</p>
        <p className="text-xs mt-1 opacity-80">{error}</p>
      </div>
    );
  }

  if (cues.length === 0) return null;

  return (
    <div className="subtle-panel flex flex-col mt-6 overflow-hidden max-h-[500px]">
      <div className="p-4 border-b border-border/60 flex items-center justify-between bg-card/40">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Transcript
        </h3>
        <Badge variant="secondary" className="text-xs font-normal">
          {cues.length} cues
        </Badge>
      </div>

      <div className="p-3 border-b border-border/60 bg-background/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcript..."
            className="pl-8 h-8 text-sm bg-background"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {filteredCues.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No matches found for "{search}"
          </div>
        ) : (
          <div className="space-y-1.5 pr-3">
            {filteredCues.map((cue) => (
              <button
                key={cue.id}
                onClick={() => onSeekTo(cue.start)}
                className="w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors group flex gap-3 text-sm"
              >
                <span className="text-primary font-mono text-[10px] pt-0.5 shrink-0 w-12 group-hover:underline">
                  {formatTime(cue.start)}
                </span>
                <span className="text-foreground/90 whitespace-pre-wrap">{cue.text}</span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Ensure Badge is imported for use above
import { Badge } from '@/components/ui/badge';
