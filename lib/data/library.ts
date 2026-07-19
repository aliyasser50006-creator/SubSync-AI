import { createClient } from '@/lib/supabase/server';
import { BrowseVideo } from '@/lib/types/video-browser';
import { Job } from '@/lib/types/database';
import { escapeIlike } from '@/lib/utils/escape-ilike';

export const DEFAULT_LIBRARY_PAGE_SIZE = 12;
export const LIBRARY_STATUSES = ['all', 'ready', 'processing', 'pending', 'failed'] as const;
export const LIBRARY_SORTS = ['newest', 'oldest', 'name-asc', 'name-desc'] as const;

export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];
export type LibrarySort = (typeof LIBRARY_SORTS)[number];
export type LibraryVideo = BrowseVideo & { status?: Job['status'] };
export type LibrarySearchParams = Record<string, string | string[] | undefined>;

export interface LibraryPageData {
  videos: LibraryVideo[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  status: LibraryStatus;
  sort: LibrarySort;
  stats: { totalCount: number; readyCount: number; processingCount: number };
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseLibraryPage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstValue(value) || '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseLibraryStatus(value: string | string[] | undefined): LibraryStatus {
  const status = firstValue(value);
  return LIBRARY_STATUSES.includes(status as LibraryStatus) ? (status as LibraryStatus) : 'all';
}

export function parseLibrarySort(value: string | string[] | undefined): LibrarySort {
  const sort = firstValue(value);
  return LIBRARY_SORTS.includes(sort as LibrarySort) ? (sort as LibrarySort) : 'newest';
}

export function parseLibraryQuery(value: string | string[] | undefined) {
  return (firstValue(value) || '').trim().slice(0, 200);
}

function getPageSize() {
  const configured = Number.parseInt(process.env.LIBRARY_PAGE_SIZE || '', 10);
  return Number.isFinite(configured) && configured > 0 && configured <= 100
    ? configured
    : DEFAULT_LIBRARY_PAGE_SIZE;
}

export async function getLibraryPageData({
  userId,
  page,
  searchQuery,
  status,
  sort,
}: {
  userId: string;
  page: number;
  searchQuery?: string;
  status: LibraryStatus;
  sort: LibrarySort;
}): Promise<LibraryPageData> {
  const supabase = await createClient();
  const pageSize = getPageSize();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let pageQuery = supabase
    .from('jobs')
    .select('id, title, video_url, img_url, subtitle_file, subtitle_settings, created_at, status', { count: 'exact' })
    .eq('user_id', userId);

  if (searchQuery) {
    pageQuery = pageQuery.ilike('title', `%${escapeIlike(searchQuery)}%`);
  }

  if (status === 'ready') {
    pageQuery = pageQuery.in('status', ['ready', 'done']);
  } else if (status !== 'all') {
    pageQuery = pageQuery.eq('status', status);
  }

  switch (sort) {
    case 'oldest': pageQuery = pageQuery.order('created_at', { ascending: true }); break;
    case 'name-asc': pageQuery = pageQuery.order('title', { ascending: true, nullsFirst: false }); break;
    case 'name-desc': pageQuery = pageQuery.order('title', { ascending: false, nullsFirst: false }); break;
    default: pageQuery = pageQuery.order('created_at', { ascending: false });
  }
  pageQuery = pageQuery.order('id', { ascending: true });

  const [pageResult, totalResult, readyResult, processingResult] = await Promise.all([
    pageQuery.range(from, to),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['ready', 'done']),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['processing', 'pending']),
  ]);

  if (pageResult.error) throw new Error(`Unable to load the video library: ${pageResult.error.message}`);

  const videos: LibraryVideo[] = (pageResult.data || [])
    .filter((item) => item?.id && item?.video_url)
    .map((item) => ({
      id: String(item.id),
      name: String(item.title ?? '').trim() || 'Untitled video',
      video_url: String(item.video_url).trim(),
      img_url: item.img_url?.trim() || null,
      subtitle_file: item.subtitle_file?.trim() || null,
      subtitle_settings: item.subtitle_settings || null,
      created_at: item.created_at || undefined,
      status: item.status as Job['status'],
    }));

  const totalCount = pageResult.count || 0;
  return {
    videos,
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    status,
    sort,
    stats: {
      totalCount: totalResult.count || 0,
      readyCount: readyResult.count || 0,
      processingCount: processingResult.count || 0,
    },
  };
}
