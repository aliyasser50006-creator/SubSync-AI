'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveSubtitleContent } from '@/lib/actions/subtitles';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface UseAutoSaveOptions {
  subtitleId: string;
  isDirty: boolean;
  serialize: () => string;
  resetDirty: () => void;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  manualSave: () => Promise<void>;
  triggerBlurSave: () => void;
}

export function useAutoSave({
  subtitleId,
  isDirty,
  serialize,
  resetDirty,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const serializeRef = useRef(serialize);
  const resetDirtyRef = useRef(resetDirty);

  serializeRef.current = serialize;
  resetDirtyRef.current = resetDirty;

  const performSave = useCallback(async () => {
    if (savingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    savingRef.current = true;
    setSaveStatus('saving');
    const content = serializeRef.current();

    try {
      const { error, errorDetails } = await saveSubtitleContent(subtitleId, content);

      if (error) {
        console.error('Auto-save failed:', error);
        console.error('Supabase Error:', errorDetails || { message: error });
        setSaveStatus('error');
      } else {
        setLastSavedAt(new Date());

        if (serializeRef.current() === content) {
          setSaveStatus('saved');
          resetDirtyRef.current();
        } else {
          pendingSaveRef.current = true;
          setSaveStatus('unsaved');
        }
      }
    } catch (err) {
      console.error('Auto-save error:', err);
      setSaveStatus('error');
    } finally {
      savingRef.current = false;

      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void performSave();
      }
    }
  }, [subtitleId]);

  useEffect(() => {
    if (!isDirty) return;
    if (saveStatus !== 'unsaved') {
      setSaveStatus('unsaved');
    }
  }, [isDirty, saveStatus]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const manualSave = useCallback(async () => {
    await performSave();
  }, [performSave]);

  const triggerBlurSave = useCallback(() => {
    if (!isDirty || savingRef.current) return;
    void performSave();
  }, [isDirty, performSave]);

  return { saveStatus, lastSavedAt, manualSave, triggerBlurSave };
}
