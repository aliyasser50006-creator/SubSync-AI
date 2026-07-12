'use client';

import { useState, useCallback, useRef } from 'react';
import { EditableCue } from '@/lib/types/database';

const MAX_UNDO_STACK = 50;

function generateCueId(): string {
  return crypto.randomUUID();
}

function reindex(cues: EditableCue[]): EditableCue[] {
  return cues.map((cue, i) => ({ ...cue, index: i + 1 }));
}

function formatSrtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVttTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export interface UseEditorStateReturn {
  cues: EditableCue[];
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedCueIds: Set<string>;
  activeCueId: string | null;

  updateCueText: (id: string, text: string) => void;
  updateCueTime: (id: string, field: 'start' | 'end', seconds: number) => void;
  addCue: (afterId?: string) => void;
  deleteCue: (id: string) => void;
  duplicateCue: (id: string) => void;
  mergeCues: (id1: string, id2: string) => void;
  splitCue: (id: string, splitAtCharIndex: number) => void;
  reorderCue: (id: string, direction: 'up' | 'down') => void;
  moveCue: (fromIndex: number, toIndex: number) => void;
  deleteSelectedCues: () => void;

  toggleCueSelection: (id: string) => void;
  selectAllCues: () => void;
  clearSelection: () => void;
  setActiveCueId: (id: string | null) => void;

  undo: () => void;
  redo: () => void;

  serialize: (format: 'srt' | 'vtt') => string;
  setCues: (cues: EditableCue[]) => void;
  resetDirty: () => void;
}

export function useEditorState(initialCues: EditableCue[] = []): UseEditorStateReturn {
  const [cues, setCuesState] = useState<EditableCue[]>(initialCues);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedCueIds, setSelectedCueIds] = useState<Set<string>>(new Set());
  const [activeCueId, setActiveCueId] = useState<string | null>(null);

  const undoStackRef = useRef<EditableCue[][]>([]);
  const redoStackRef = useRef<EditableCue[][]>([]);
  const [undoLength, setUndoLength] = useState(0);
  const [redoLength, setRedoLength] = useState(0);

  const pushUndo = useCallback((prev: EditableCue[]) => {
    undoStackRef.current = [...undoStackRef.current.slice(-MAX_UNDO_STACK + 1), prev];
    redoStackRef.current = [];
    setUndoLength(undoStackRef.current.length);
    setRedoLength(0);
  }, []);

  const applyUpdate = useCallback(
    (updater: (prev: EditableCue[]) => EditableCue[]) => {
      setCuesState((prev) => {
        pushUndo(prev);
        const next = updater(prev);
        return reindex(next);
      });
      setIsDirty(true);
    },
    [pushUndo]
  );

  const updateCueText = useCallback(
    (id: string, text: string) => {
      applyUpdate((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
    },
    [applyUpdate]
  );

  const updateCueTime = useCallback(
    (id: string, field: 'start' | 'end', seconds: number) => {
      const safeSeconds = Math.max(0, seconds);
      applyUpdate((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: safeSeconds } : c))
      );
    },
    [applyUpdate]
  );

  const addCue = useCallback(
    (afterId?: string) => {
      applyUpdate((prev) => {
        const idx = afterId ? prev.findIndex((c) => c.id === afterId) : prev.length - 1;
        const insertAt = idx >= 0 ? idx + 1 : prev.length;
        const prevCue = prev[insertAt - 1];
        const newStart = prevCue ? prevCue.end + 0.1 : 0;
        const newCue: EditableCue = {
          id: generateCueId(),
          index: 0,
          start: newStart,
          end: newStart + 2,
          text: '',
        };
        const next = [...prev];
        next.splice(insertAt, 0, newCue);
        return next;
      });
    },
    [applyUpdate]
  );

  const deleteCue = useCallback(
    (id: string) => {
      applyUpdate((prev) => prev.filter((c) => c.id !== id));
      setSelectedCueIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [applyUpdate]
  );

  const duplicateCue = useCallback(
    (id: string) => {
      applyUpdate((prev) => {
        const idx = prev.findIndex((c) => c.id === id);
        if (idx < 0) return prev;
        const original = prev[idx];
        const clone: EditableCue = {
          ...original,
          id: generateCueId(),
          index: 0,
        };
        const next = [...prev];
        next.splice(idx + 1, 0, clone);
        return next;
      });
    },
    [applyUpdate]
  );

  const mergeCues = useCallback(
    (id1: string, id2: string) => {
      applyUpdate((prev) => {
        const i1 = prev.findIndex((c) => c.id === id1);
        const i2 = prev.findIndex((c) => c.id === id2);
        if (i1 < 0 || i2 < 0) return prev;
        const c1 = prev[Math.min(i1, i2)];
        const c2 = prev[Math.max(i1, i2)];
        const merged: EditableCue = {
          id: c1.id,
          index: 0,
          start: Math.min(c1.start, c2.start),
          end: Math.max(c1.end, c2.end),
          text: `${c1.text}\n${c2.text}`,
        };
        return prev
          .filter((c) => c.id !== c2.id)
          .map((c) => (c.id === c1.id ? merged : c));
      });
    },
    [applyUpdate]
  );

  const splitCue = useCallback(
    (id: string, splitAtCharIndex: number) => {
      applyUpdate((prev) => {
        const idx = prev.findIndex((c) => c.id === id);
        if (idx < 0) return prev;
        const cue = prev[idx];
        const text1 = cue.text.slice(0, splitAtCharIndex).trim();
        const text2 = cue.text.slice(splitAtCharIndex).trim();
        if (!text1 && !text2) return prev;
        const midpoint = (cue.start + cue.end) / 2;
        const first: EditableCue = { ...cue, end: midpoint, text: text1 || cue.text };
        const second: EditableCue = {
          id: generateCueId(),
          index: 0,
          start: midpoint + 0.001,
          end: cue.end,
          text: text2 || '',
        };
        const next = [...prev];
        next.splice(idx, 1, first, second);
        return next;
      });
    },
    [applyUpdate]
  );

  const reorderCue = useCallback(
    (id: string, direction: 'up' | 'down') => {
      applyUpdate((prev) => {
        const idx = prev.findIndex((c) => c.id === id);
        if (idx < 0) return prev;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
        return next;
      });
    },
    [applyUpdate]
  );

  const moveCue = useCallback(
    (fromIndex: number, toIndex: number) => {
      applyUpdate((prev) => {
        if (fromIndex < 0 || fromIndex >= prev.length) return prev;
        if (toIndex < 0 || toIndex >= prev.length) return prev;
        if (fromIndex === toIndex) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [applyUpdate]
  );

  const deleteSelectedCues = useCallback(() => {
    if (selectedCueIds.size === 0) return;
    applyUpdate((prev) => prev.filter((c) => !selectedCueIds.has(c.id)));
    setSelectedCueIds(new Set());
  }, [applyUpdate, selectedCueIds]);

  const toggleCueSelection = useCallback((id: string) => {
    setSelectedCueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllCues = useCallback(() => {
    setSelectedCueIds(new Set(cues.map((c) => c.id)));
  }, [cues]);

  const clearSelection = useCallback(() => {
    setSelectedCueIds(new Set());
  }, []);

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    setCuesState((current) => {
      redoStackRef.current.push(current);
      setRedoLength(redoStackRef.current.length);
      return prev;
    });
    setUndoLength(undoStackRef.current.length);
    setIsDirty(true);
  }, []);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    setCuesState((current) => {
      undoStackRef.current.push(current);
      setUndoLength(undoStackRef.current.length);
      return next;
    });
    setRedoLength(redoStackRef.current.length);
    setIsDirty(true);
  }, []);

  const serialize = useCallback(
    (format: 'srt' | 'vtt'): string => {
      if (cues.length === 0) return format === 'vtt' ? 'WEBVTT\n\n' : '';
      const sorted = [...cues].sort((a, b) => a.start - b.start);
      const fmtTime = format === 'vtt' ? formatVttTimestamp : formatSrtTimestamp;

      if (format === 'vtt') {
        const lines = ['WEBVTT', ''];
        sorted.forEach((cue) => {
          lines.push(`${fmtTime(cue.start)} --> ${fmtTime(cue.end)}`);
          lines.push(cue.text);
          lines.push('');
        });
        return lines.join('\n');
      }

      const lines: string[] = [];
      sorted.forEach((cue, i) => {
        lines.push(`${i + 1}`);
        lines.push(`${fmtTime(cue.start)} --> ${fmtTime(cue.end)}`);
        lines.push(cue.text);
        lines.push('');
      });
      return lines.join('\n');
    },
    [cues]
  );

  const setCues = useCallback((newCues: EditableCue[]) => {
    setCuesState(reindex(newCues));
    undoStackRef.current = [];
    redoStackRef.current = [];
    setUndoLength(0);
    setRedoLength(0);
    setIsDirty(false);
    setSelectedCueIds(new Set());
  }, []);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    cues,
    isDirty,
    canUndo: undoLength > 0,
    canRedo: redoLength > 0,
    selectedCueIds,
    activeCueId,
    updateCueText,
    updateCueTime,
    addCue,
    deleteCue,
    duplicateCue,
    mergeCues,
    splitCue,
    reorderCue,
    moveCue,
    deleteSelectedCues,
    toggleCueSelection,
    selectAllCues,
    clearSelection,
    setActiveCueId,
    undo,
    redo,
    serialize,
    setCues,
    resetDirty,
  };
}
