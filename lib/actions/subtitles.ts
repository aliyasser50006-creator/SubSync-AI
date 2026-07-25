'use server';

import { createClient } from '@/lib/supabase/server';
import { Subtitle } from '@/lib/types/database';

const SUBTITLE_BUCKET = 'subtitles';
const MAX_SUBTITLE_BYTES = 5 * 1024 * 1024;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface SupabaseErrorDetails {
  name?: string;
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  statusCode?: string | number;
}

function encodeId(path: string): string {
  return Buffer.from(path).toString('base64url');
}

function decodeId(id: string): string {
  return Buffer.from(id, 'base64url').toString('utf-8');
}

function getFormat(filename: string): 'srt' | 'vtt' {
  return filename.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt';
}

function formatTitle(filename: string): string {
  return filename.replace(/\.(srt|vtt)$/i, '');
}

function countCues(content: string): number {
  return content.split(/\r?\n/).filter((line) => line.includes('-->')).length;
}

export async function getUserSubtitles(
  page: number = 1,
  limit: number = 12,
  search?: string,
  sort: string = 'newest'
): Promise<{ data?: Subtitle[]; count?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { error: 'Unauthorized' };

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .not('subtitle_file', 'is', null)
      .eq('user_id', user.id);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title-asc':
        query = query.order('title', { ascending: true });
        break;
      case 'title-desc':
        query = query.order('title', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: jobs, count, error: dbError } = await query.range(from, to);

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return { error: dbError.message };
    }

    // Fetch storage metadata for the requested page to get accurate sizes
    const storagePromises = (jobs || []).map(async (job) => {
      const path = job.subtitle_file;
      const filename = path.split('/').pop() || '';
      
      const size = 0;

      return {
        id: encodeId(path),
        user_id: user.id,
        title: job.title || formatTitle(filename),
        format: getFormat(filename),
        line_count: 0,
        size: size,
        subtitle_content: '',
        path,
        created_at: job.created_at,
        updated_at: job.updated_at,
        job_status: job.status
      };
    });

    const result = await Promise.all(storagePromises);

    return { data: result, count: count || 0 };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to fetch subtitles' };
  }
}

export async function getSubtitleById(
  subtitleId: string
): Promise<{ data?: Subtitle; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { error: 'Unauthorized' };

    let path: string;
    try {
      path = decodeId(subtitleId);
    } catch {
      return { error: 'Invalid subtitle ID' };
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(SUBTITLE_BUCKET)
      .download(path);

    if (downloadError || !fileData) {
      return { error: downloadError?.message || 'Failed to download subtitle' };
    }

    // Try to get updated info. Not failing if it errors
    const { data: fileMeta } = await supabase.storage
      .from(SUBTITLE_BUCKET)
      .info(path);

    const content = await fileData.text();
    const filename = path.split('/').pop() || 'subtitle.srt';

    return {
      data: {
        id: subtitleId,
        user_id: user.id,
        title: formatTitle(filename),
        format: getFormat(filename),
        line_count: countCues(content),
        size: fileData.size,
        subtitle_content: content,
        path: path,
        created_at: fileMeta?.createdAt || new Date().toISOString(),
        updated_at: fileMeta?.updatedAt || new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to fetch subtitle' };
  }
}

export async function saveSubtitleContent(
  subtitleId: string,
  content: string
): Promise<{ data?: Subtitle; error?: string; errorDetails?: SupabaseErrorDetails }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { error: 'Unauthorized' };

    let path: string;
    try {
      path = decodeId(subtitleId);
    } catch {
      return { error: 'Invalid subtitle ID' };
    }

    // Must be in user's folder
    if (!path.startsWith(`${user.id}/`)) {
      return { error: 'Unauthorized access to subtitle' };
    }

    const contentLength = Buffer.byteLength(content, 'utf8');
    if (contentLength > MAX_SUBTITLE_BYTES) {
      return { error: 'Subtitle content exceeds 5MB limit' };
    }

    const { error: uploadError } = await supabase.storage
      .from(SUBTITLE_BUCKET)
      .update(path, content, {
        contentType: getFormat(path) === 'vtt' ? 'text/vtt' : 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Error Full:', uploadError);
      return { error: uploadError.message };
    }

    const { data: fileMeta } = await supabase.storage
      .from(SUBTITLE_BUCKET)
      .info(path);

    const filename = path.split('/').pop() || 'subtitle.srt';

    return { 
      data: {
        id: subtitleId,
        user_id: user.id,
        title: formatTitle(filename),
        format: getFormat(filename),
        line_count: countCues(content),
        size: contentLength,
        subtitle_content: content,
        path: path,
        created_at: fileMeta?.createdAt || new Date().toISOString(),
        updated_at: fileMeta?.updatedAt || new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to save subtitle content' };
  }
}

export async function deleteSubtitle(subtitleId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { error: 'Unauthorized' };

    let path: string;
    try {
      path = decodeId(subtitleId);
    } catch {
      return { error: 'Invalid subtitle ID' };
    }

    if (!path.startsWith(`${user.id}/`)) {
      return { error: 'Unauthorized access to subtitle' };
    }

    const { error: removeError } = await supabase.storage
      .from(SUBTITLE_BUCKET)
      .remove([path]);

    if (removeError) {
      return { error: removeError.message };
    }

    return {};
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to delete subtitle' };
  }
}

export async function deleteSubtitles(subtitleIds: string[]): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { error: 'Unauthorized' };

    const pathsToRemove: string[] = [];
    for (const subtitleId of subtitleIds) {
      let path: string;
      try {
        path = decodeId(subtitleId);
        if (path.startsWith(`${user.id}/`)) {
          pathsToRemove.push(path);
        }
      } catch {
        continue;
      }
    }

    if (pathsToRemove.length > 0) {
      const { error: removeError } = await supabase.storage
        .from(SUBTITLE_BUCKET)
        .remove(pathsToRemove);

      if (removeError) {
        return { error: removeError.message };
      }
    }

    return {};
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to delete subtitles' };
  }
}

export async function duplicateSubtitle(
  subtitleId: string
): Promise<{ data?: Subtitle; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { error: 'Unauthorized' };

    let path: string;
    try {
      path = decodeId(subtitleId);
    } catch {
      return { error: 'Invalid subtitle ID' };
    }

    if (!path.startsWith(`${user.id}/`)) {
      return { error: 'Unauthorized access to subtitle' };
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(SUBTITLE_BUCKET)
      .download(path);

    if (downloadError || !fileData) {
      return { error: downloadError?.message || 'Failed to download original subtitle' };
    }

    const content = await fileData.text();
    const filename = path.split('/').pop() || 'subtitle.srt';
    const extension = filename.includes('.') ? filename.split('.').pop() : 'srt';
    const baseName = formatTitle(filename);
    const newFilename = `${baseName} (Copy) - ${Date.now()}.${extension}`;
    const newPath = `${user.id}/${newFilename}`;

    const { error: uploadError } = await supabase.storage
      .from(SUBTITLE_BUCKET)
      .upload(newPath, content, {
        contentType: extension === 'vtt' ? 'text/vtt' : 'text/plain',
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data: fileMeta } = await supabase.storage
      .from(SUBTITLE_BUCKET)
      .info(newPath);

    return { 
      data: {
        id: encodeId(newPath),
        user_id: user.id,
        title: formatTitle(newFilename),
        format: getFormat(newFilename),
        line_count: countCues(content),
        size: fileData.size,
        subtitle_content: content,
        path: newPath,
        created_at: fileMeta?.createdAt || new Date().toISOString(),
        updated_at: fileMeta?.updatedAt || new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to duplicate subtitle' };
  }
}

export async function getDownloadUrl(
  subtitleId: string
): Promise<{ url?: string; error?: string }> {
  return {
    url: `/api/subtitles/download?id=${encodeURIComponent(subtitleId)}`,
  };
}
