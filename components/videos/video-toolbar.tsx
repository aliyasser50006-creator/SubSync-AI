'use client';

import { ChangeEvent } from 'react';
import { RotateCcw, Search, Shuffle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VideoToolbarProps {
  searchTerm: string;
  randomCount: number;
  maxCount: number;
  isRandomized: boolean;
  shownCount: number;
  totalCount: number;
  isDisabled: boolean;
  onSearchChange: (value: string) => void;
  onRandomCountChange: (value: number) => void;
  onRandomize: () => void;
  onBackToAll: () => void;
}

export function VideoToolbar({
  searchTerm,
  randomCount,
  maxCount,
  isRandomized,
  shownCount,
  totalCount,
  isDisabled,
  onSearchChange,
  onRandomCountChange,
  onRandomize,
  onBackToAll,
}: VideoToolbarProps) {
  const handleCountInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);

    if (Number.isNaN(nextValue) || nextValue < 1) {
      onRandomCountChange(1);
      return;
    }

    onRandomCountChange(nextValue);
  };

  return (
    <div className="surface-panel p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_96px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value.slice(0, 120))}
            placeholder="Search by video name"
            className="pl-11"
            disabled={isDisabled}
          />
        </div>

        <Input
          type="number"
          min={1}
          max={maxCount}
          value={randomCount}
          onChange={handleCountInput}
          className="text-center"
          aria-label="Number of random videos to show"
          disabled={isDisabled}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={onRandomize}
            className="flex-1"
            disabled={isDisabled}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Random Videos
          </Button>

          {isRandomized && (
            <Button
              type="button"
              variant="outline"
              onClick={onBackToAll}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              All
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Showing <span className="font-semibold text-foreground">{shownCount}</span> of <span className="font-semibold text-foreground">{totalCount}</span>
        </p>
        <p>{isRandomized ? 'Random mode active' : 'Search is debounced (300ms)'}</p>
      </div>
    </div>
  );
}
