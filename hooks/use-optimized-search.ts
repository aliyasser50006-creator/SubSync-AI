'use client';

/**
 * useOptimizedSearch
 *
 * A production-grade, reusable search hook for Supabase queries.
 *
 * Guarantees:
 * - Debounced search (configurable, default 300ms) — smooths keystrokes into
 *   a single request per pause, keeping the UI responsive.
 * - Request cancellation via AbortController — aborts the previous in-flight
 *   Supabase fetch whenever a new query starts, preventing wasted bandwidth.
 * - Race-condition safety — a monotonically-increasing request counter ensures
 *   that a slow earlier response can never overwrite a fast later response.
 * - Deduplication — skips firing if the new trimmed query is identical to the
 *   last successfully fetched query (e.g. focus/blur cycles).
 * - In-memory result cache (Map) — returns cached data instantly for repeated
 *   queries within the same session, with a configurable max-entries LRU eviction.
 * - Empty/whitespace guard — never fires a request for blank input.
 * - Generic type parameter for flexible result shapes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeSearchQuery } from '@/lib/utils/escape-ilike';

// Convenience alias for Supabase's dynamic query builder.
// Using `any` here is idiomatic — the Supabase query builder uses heavily
// parameterised generics that don't compose well across abstraction boundaries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPostgrestQuery = ReturnType<SupabaseClient['from']> & Record<string, any>;

export interface SearchState<T> {
  /** Results from the latest completed search (empty array when no query). */
  data: T[];
  /** True while a request is in-flight (after debounce fires). */
  isLoading: boolean;
  /** Error message from the most recent failed request, null otherwise. */
  error: string | null;
  /** The trimmed query string that produced the current `data`. */
  activeQuery: string;
}

export interface UseOptimizedSearchOptions<T> {
  /** Supabase client instance (memoised by the caller). */
  supabase: SupabaseClient;
  /** The table to search. */
  table: string;
  /** The column to apply ILIKE on. */
  searchColumn: string;
  /** Columns to SELECT, separated by commas. Defaults to '*'. */
  selectColumns?: string;
  /**
   * Optional additional query modifiers applied after the ILIKE filter.
   * Return the modified builder from this callback.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyFilters?: (query: any, signal: AbortSignal) => any;
  /** Transform each raw row into the desired shape. */
  transform: (row: Record<string, unknown>) => T;
  /** Maximum number of rows to return. Default: 25. */
  limit?: number;
  /** Debounce delay in ms. Default: 300. */
  debounceMs?: number;
  /** Maximum cached query entries before LRU eviction. Default: 50. */
  maxCacheEntries?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Simple LRU eviction: delete the oldest entry when the map exceeds capacity. */
function evictOldestIfNeeded<K, V>(map: Map<K, V>, maxEntries: number): void {
  if (map.size >= maxEntries) {
    const firstKey = map.keys().next().value;
    if (firstKey !== undefined) map.delete(firstKey);
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOptimizedSearch<T>(
  rawQuery: string,
  options: UseOptimizedSearchOptions<T>,
): SearchState<T> {
  const {
    supabase,
    table,
    searchColumn,
    selectColumns = '*',
    applyFilters,
    transform,
    limit = 25,
    debounceMs = 300,
    maxCacheEntries = 50,
  } = options;

  // ── Stable refs so callbacks don't stale-close over outdated values ────────
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  // ── In-memory result cache: escapedQuery → T[] ────────────────────────────
  const cacheRef = useRef<Map<string, T[]>>(new Map());

  // ── Request counter for race-condition prevention ─────────────────────────
  const requestCounterRef = useRef(0);

  // ── Last successfully-served query (trimmed, unescaped) ───────────────────
  const lastServedQueryRef = useRef<string | null>(null);

  // ── AbortController for the current in-flight request ─────────────────────
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Component state ───────────────────────────────────────────────────────
  const [state, setState] = useState<SearchState<T>>({
    data: [],
    isLoading: false,
    error: null,
    activeQuery: '',
  });

  // ── Core fetch function ───────────────────────────────────────────────────
  const executeSearch = useCallback(async (trimmedQuery: string) => {
    const { supabase, table, searchColumn, selectColumns = '*', applyFilters, transform, limit = 25, maxCacheEntries = 50 } = optionsRef.current;

    // Guard: skip whitespace-only queries
    const safeQuery = sanitizeSearchQuery(trimmedQuery);
    if (!safeQuery) {
      setState({ data: [], isLoading: false, error: null, activeQuery: '' });
      lastServedQueryRef.current = '';
      return;
    }

    // Guard: skip duplicate queries
    if (trimmedQuery === lastServedQueryRef.current) {
      return;
    }

    // Cache hit → return immediately, no loading flash
    const cacheKey = `${table}:${searchColumn}:${limit}:${safeQuery}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setState({ data: cached, isLoading: false, error: null, activeQuery: trimmedQuery });
      lastServedQueryRef.current = trimmedQuery;
      return;
    }

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Stamp this request
    const requestId = ++requestCounterRef.current;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Build the base query; route through unknown to satisfy the TypeScript
      // overlap check between PostgrestQueryBuilder and PostgrestFilterBuilder.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: AnyPostgrestQuery = (supabase
        .from(table)
        .select(selectColumns)
        .ilike(searchColumn, `%${safeQuery}%`)
        .limit(limit)
        .abortSignal(controller.signal) as unknown) as AnyPostgrestQuery;

      if (applyFilters) {
        q = applyFilters(q, controller.signal);
      }

      const { data, error } = await q;

      // Discard stale responses — a newer request has already taken over
      if (requestId !== requestCounterRef.current) return;
      // Discard aborted responses
      if (controller.signal.aborted) return;

      if (error) {
        // AbortError means we cancelled intentionally — not a real error
        if (error.message?.includes('AbortError') || error.message?.includes('aborted')) return;
        setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
        return;
      }

      const results: T[] = ((data as unknown as Record<string, unknown>[] | null) ?? []).map(transform);

      // Populate cache with LRU eviction
      evictOldestIfNeeded(cacheRef.current, maxCacheEntries);
      cacheRef.current.set(cacheKey, results);

      lastServedQueryRef.current = trimmedQuery;
      setState({ data: results, isLoading: false, error: null, activeQuery: trimmedQuery });
    } catch (err) {
      if (requestId !== requestCounterRef.current) return;
      if (controller.signal.aborted) return;

      // AbortError = intentional cancel, not a user-visible error
      if (err instanceof Error && err.name === 'AbortError') return;

      const message = err instanceof Error ? err.message : 'Search failed. Please try again.';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — options accessed via ref

  // ── Debounced trigger ────────────────────────────────────────────────────
  const trimmedQuery = rawQuery.trim();

  useEffect(() => {
    // Immediately clear results if query is blanked
    if (!trimmedQuery) {
      abortControllerRef.current?.abort();
      lastServedQueryRef.current = '';
      setState({ data: [], isLoading: false, error: null, activeQuery: '' });
      return;
    }

    const timerId = setTimeout(() => {
      executeSearch(trimmedQuery);
    }, debounceMs);

    return () => {
      clearTimeout(timerId);
    };
  }, [trimmedQuery, debounceMs, executeSearch]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return useMemo(() => state, [state]);
}
