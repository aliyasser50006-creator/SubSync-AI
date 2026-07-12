'use client';

import React from 'react';
import { Trash2, Download, CheckSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkExport?: () => void;
  isDeleting?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  isDeleting = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="floating-toolbar flex items-center gap-4 animate-fade-up">
      <div className="flex items-center gap-2 pr-2 border-r border-border/60">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-xs font-bold">
          {selectedCount}
        </div>
        <span className="text-sm font-medium text-foreground">Selected</span>
      </div>

      <div className="flex items-center gap-2">
        {onBulkExport && (
          <Button variant="outline" size="sm" onClick={onBulkExport} className="h-8 text-xs font-medium">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export Subtitles
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          disabled={isDeleting}
          className="h-8 text-xs font-medium shadow-xs"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {isDeleting ? 'Deleting...' : 'Delete Selected'}
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClearSelection}
        className="h-7 w-7 text-muted-foreground hover:text-foreground ml-1"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
