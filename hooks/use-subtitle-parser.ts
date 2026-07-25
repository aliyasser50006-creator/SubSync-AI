'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  decodeSubtitleBytes,
  parseSubtitleContent,
  type ParsedSubtitleCue,
} from '@/lib/utils/subtitle-converter';

export interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface UseSubtitleParserResult {
  cues: SubtitleCue[];
  loading: boolean;
  error: string | null;
}

const MAX_SUBTITLE_CACHE_ENTRIES = 20;
const subtitleCueCache = new Map<string, SubtitleCue[]>();

function mapParsedCue(cue: ParsedSubtitleCue): SubtitleCue {
  return {
    id: cue.id,
    start: cue.start,
    end: cue.end,
    text: cue.text,
  };
}

function cacheSubtitleCues(url: string, cues: SubtitleCue[]) {
  if (subtitleCueCache.has(url)) {
    subtitleCueCache.delete(url);
  }

  subtitleCueCache.set(url, cues);

  if (subtitleCueCache.size > MAX_SUBTITLE_CACHE_ENTRIES) {
    const oldestKey = subtitleCueCache.keys().next().value;
    if (oldestKey) subtitleCueCache.delete(oldestKey);
  }
}

export function useSubtitleParser(url: string | null): UseSubtitleParserResult {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndParse = useCallback(async (subtitleUrl: string, signal: AbortSignal) => {
    const cachedCues = subtitleCueCache.get(subtitleUrl);
    if (cachedCues) {
      setCues(cachedCues);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setCues([]);

    try {
      const response = await fetch(subtitleUrl, { signal, cache: 'force-cache' });

      if (!response.ok) {
        throw new Error(`Failed to load subtitle file (HTTP ${response.status})`);
      }

      const bytes = await response.arrayBuffer();
      const content = decodeSubtitleBytes(bytes);
      const trimmed = content.trim();

      if (!trimmed) {
        throw new Error('Subtitle file is empty.');
      }

      const parsed = parseSubtitleContent(trimmed).map(mapParsedCue);

      if (parsed.length === 0) {
        throw new Error('Subtitle file contains no valid cues.');
      }

      cacheSubtitleCues(subtitleUrl, parsed);
      setCues(parsed);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      const message = err instanceof Error ? err.message : 'Failed to parse subtitles.';
      setError(message);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!url) {
      setCues([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    fetchAndParse(url, controller.signal);

    return () => {
      controller.abort();
    };
  }, [url, fetchAndParse]);

  return { cues, loading, error };
}

