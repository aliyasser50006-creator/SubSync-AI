'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Globe2, Loader2, SearchCheck, Shuffle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RandomVideosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  searchResultCount: number;
  libraryTotalCount: number;
  isGenerating: boolean;
  onGenerate: (options: { count: number; useSearchResults: boolean }) => void;
}

export function RandomVideosDialog({
  open,
  onOpenChange,
  searchQuery,
  searchResultCount,
  libraryTotalCount,
  isGenerating,
  onGenerate,
}: RandomVideosDialogProps) {
  const hasSearch = searchQuery.trim().length > 0;
  const [scope, setScope] = useState<'search' | 'all'>('search');
  const [countInput, setCountInput] = useState('10');
  const [error, setError] = useState('');
  const maximum = hasSearch && scope === 'search' ? searchResultCount : libraryTotalCount;

  useEffect(() => {
    if (!open) return;
    setScope('search');
    setCountInput(String(Math.min(10, Math.max(1, hasSearch ? searchResultCount : libraryTotalCount))));
    setError('');
  }, [open, hasSearch, searchResultCount, libraryTotalCount]);

  useEffect(() => {
    const current = Number.parseInt(countInput, 10);
    if (maximum > 0 && current > maximum) setCountInput(String(maximum));
  }, [maximum, countInput]);

  const helper = useMemo(() => {
    if (maximum === 0) return 'No videos are available for this selection.';
    return `Choose how many random videos you want to display. Maximum: ${maximum}.`;
  }, [maximum]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const count = Number(countInput);
    if (!Number.isInteger(count) || count < 1) {
      setError('Enter a whole number of at least 1.');
      return;
    }
    if (count > maximum) {
      setError(`Enter ${maximum} or fewer videos.`);
      return;
    }
    setError('');
    onGenerate({ count, useSearchResults: hasSearch && scope === 'search' });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isGenerating && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shuffle className="h-5 w-5" />
            </div>
            <DialogTitle>Generate random videos</DialogTitle>
            <DialogDescription>
              Create a server-selected random set without changing your current Library view.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="random-video-count">Number of videos</Label>
            <Input
              id="random-video-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(1, maximum)}
              step={1}
              value={countInput}
              disabled={isGenerating || maximum === 0}
              onChange={(event) => {
                setCountInput(event.target.value);
                setError('');
              }}
              aria-describedby="random-count-help random-count-error"
            />
            <p id="random-count-help" className="text-xs text-muted-foreground">{helper}</p>
            {error && <p id="random-count-error" className="text-xs font-medium text-destructive">{error}</p>}
          </div>

          {hasSearch && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/25 p-4">
              <div>
                <p className="text-sm font-semibold">Randomize only from the current search results?</p>
                <p className="mt-1 text-xs text-muted-foreground">Active search: &quot;{searchQuery}&quot;</p>
              </div>
              <RadioGroup value={scope} onValueChange={(value) => setScope(value as 'search' | 'all')}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background/60 p-3">
                  <RadioGroupItem value="search" />
                  <SearchCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Yes, use current results</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background/60 p-3">
                  <RadioGroupItem value="all" />
                  <Globe2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">No, use the entire Library</span>
                </label>
              </RadioGroup>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isGenerating} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating || maximum === 0}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
              Generate Random Videos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
