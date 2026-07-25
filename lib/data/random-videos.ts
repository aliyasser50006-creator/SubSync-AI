import { createClient } from '@/lib/supabase/server';
import { Job } from '@/lib/types/database';
import { DEFAULT_LIBRARY_PAGE_SIZE, LibraryStatus, LibraryVideo } from '@/lib/data/library';
import { getPermutationParameters, getRandomOffset } from '@/lib/data/random-selection';

const COLUMNS = 'id, title, video_url, img_url, subtitle_file, subtitle_settings, created_at, status';

type RandomRow = {
  id: string;
  title: string | null;
  video_url: string;
  img_url?: string | null;
  subtitle_file: string | null;
  subtitle_settings: Job['subtitle_settings'] | null;
  created_at: string | null;
  status: Job['status'];
};

export interface RandomLibraryPageData {
  videos: LibraryVideo[];
  page: number;
  pageSize: number;
  requestedCount: number;
  selectedCount: number;
  availableCount: number;
  totalPages: number;
  stats: { totalCount: number; readyCount: number; processingCount: number };
}

function getPageSize() {
  const value = Number.parseInt(process.env.LIBRARY_PAGE_SIZE || '', 10);
  return Number.isFinite(value) && value > 0 && value <= 100 ? value : DEFAULT_LIBRARY_PAGE_SIZE;
}

function normalizeRows(rows: RandomRow[]): LibraryVideo[] {
  return rows.filter((row) => row?.id && row?.video_url).map((row) => ({
    id: String(row.id),
    name: String(row.title ?? '').trim() || 'Untitled video',
    video_url: String(row.video_url).trim(),
    img_url: row.img_url?.trim() || null,
    subtitle_file: row.subtitle_file?.trim() || null,
    subtitle_settings: row.subtitle_settings || null,
    created_at: row.created_at || undefined,
    status: row.status,
  }));
}

function addFilters(query: any, userId: string, searchQuery: string | undefined, status: LibraryStatus) {
  let filtered = query.eq('user_id', userId);
  if (searchQuery) {
    filtered = filtered.ilike('title', `%${searchQuery.replace(/[\\%_]/g, '\\$&')}%`);
  }
  if (status === 'ready') return filtered.in('status', ['ready', 'done']);
  if (status !== 'all') return filtered.eq('status', status);
  return filtered;
}

async function fetchFallbackPage({
  supabase,
  userId,
  searchQuery,
  status,
  seed,
  availableCount,
  pageOffset,
  pageLimit,
}: any): Promise<RandomRow[]> {
  const { multiplier, increment } = getPermutationParameters(seed, availableCount);
  const offsets = Array.from({ length: pageLimit }, (_, index) =>
    getRandomOffset(pageOffset + index, availableCount, multiplier, increment)
  );

  const rows = await Promise.all(offsets.map(async (offset) => {
    let query = supabase.from('jobs').select(COLUMNS);
    query = addFilters(query, userId, searchQuery, status);
    const result = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(offset, offset)
      .maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return result.data as RandomRow | null;
  }));

  return rows.filter((row): row is RandomRow => Boolean(row));
}

export async function getRandomLibraryPageData({
  page,
  requestedCount,
  searchQuery,
  status,
  seed,
}: {
  page: number;
  requestedCount: number;
  searchQuery?: string;
  status: LibraryStatus;
  seed: string;
}): Promise<RandomLibraryPageData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let availableQuery = supabase.from('jobs').select('id', { count: 'exact', head: true });
  availableQuery = addFilters(availableQuery, user.id, searchQuery, status);

  const [availableResult, totalResult, readyResult, processingResult] = await Promise.all([
    availableQuery,
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['ready', 'done']),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['processing', 'pending']),
  ]);
  if (availableResult.error) throw new Error(availableResult.error.message);

  const availableCount = availableResult.count || 0;
  const selectedCount = Math.min(requestedCount, availableCount);
  const pageSize = getPageSize();
  const totalPages = Math.max(1, Math.ceil(selectedCount / pageSize));
  const pageOffset = (page - 1) * pageSize;
  const pageLimit = Math.max(0, Math.min(pageSize, selectedCount - pageOffset));
  let rows: RandomRow[] = [];

  if (pageLimit > 0) {
    const rpc = await supabase.rpc('get_random_library_jobs', {
      p_query: searchQuery || null,
      p_status: status,
      p_seed: seed,
      p_selection_limit: selectedCount,
      p_page_limit: pageLimit,
      p_page_offset: pageOffset,
    });

    if (!rpc.error) {
      rows = (rpc.data || []) as RandomRow[];
    } else if (rpc.error.code === 'PGRST202' || rpc.error.message.includes('get_random_library_jobs')) {
      rows = await fetchFallbackPage({
        supabase,
        userId: user.id,
        searchQuery,
        status,
        seed,
        availableCount,
        pageOffset,
        pageLimit,
      });
    } else {
      throw new Error(`Unable to generate random videos: ${rpc.error.message}`);
    }
  }

  return {
    videos: normalizeRows(rows),
    page,
    pageSize,
    requestedCount,
    selectedCount,
    availableCount,
    totalPages,
    stats: {
      totalCount: totalResult.count || 0,
      readyCount: readyResult.count || 0,
      processingCount: processingResult.count || 0,
    },
  };
}
