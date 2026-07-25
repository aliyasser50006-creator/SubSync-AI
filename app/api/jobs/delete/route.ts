import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type DeleteJobBody = {
  jobId?: string;
};

type JobStorageRow = {
  id: string;
  user_id: string;
  subtitle_file: string | null;
  output_video: string | null;
};

type StorageTarget = {
  bucket: 'subtitles' | 'videos';
  path: string;
};

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1]?.trim();
  return token ? token : null;
}

function normalizeStoragePath(value: string | null | undefined, bucket: StorageTarget['bucket']): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  let path = trimmed;

  // Try to extract the relative path by looking for known markers
  const markers = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/object/sign/${bucket}/`,
    `/storage/v1/object/authenticated/${bucket}/`,
  ];

  let foundMarker = false;
  for (const marker of markers) {
    const index = path.indexOf(marker);
    if (index !== -1) {
      path = path.substring(index + marker.length);
      foundMarker = true;
      break;
    }
  }

  // Fallback for custom domains or weird URL structures
  if (!foundMarker && path.startsWith('http')) {
    try {
      const url = new URL(path);
      const fallbackMarker = `/${bucket}/`;
      const fallbackIndex = url.pathname.indexOf(fallbackMarker);
      if (fallbackIndex !== -1) {
        path = url.pathname.substring(fallbackIndex + fallbackMarker.length);
      }
    } catch {
      // ignore invalid URLs
    }
  }

  // Strip query parameters
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    path = path.substring(0, queryIndex);
  }

  // Decode URI component (e.g., %20 to spaces)
  try {
    path = decodeURIComponent(path);
  } catch {
    // ignore malformed URI sequences
  }

  // Remove leading slashes
  return path.replace(/^\/+/, '');
}

function assertUserOwnedPath(
  path: string,
  userId: string,
  bucket: StorageTarget['bucket'],
  jobId: string,
  row: JobStorageRow,
  originalPath: string | null
) {
  if (path.includes('..') || path.startsWith('/')) {
    throw new Error(`Refusing to delete invalid ${bucket} storage path.`);
  }

  if (path !== userId && !path.startsWith(`${userId}/`)) {
    console.log(`[API /jobs/delete] Authenticated User: ${userId}`);
    console.log(`[API /jobs/delete] Video ID: ${jobId}`);
    console.log(`[API /jobs/delete] Video Record:`, row);
    console.log(`[API /jobs/delete] Video Owner: ${row.user_id}`);
    console.log(`[API /jobs/delete] Storage Path: ${originalPath}`);
    console.log(`[API /jobs/delete] Expected Prefix: ${userId}/`);
    console.log(`[API /jobs/delete] Actual Normalized Path: ${path}`);
    console.log(`[API /jobs/delete] Starts With Prefix: ${path.startsWith(`${userId}/`)}`);
    throw new Error(`Refusing to delete ${bucket} storage path outside the authenticated user's folder.`);
  }
}

function isSupabaseStoragePath(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();

  // Relative paths (e.g. "<userId>/file.mp4") are always storage paths
  if (!trimmed.startsWith('http')) return true;

  // Absolute URLs are only storage paths if they point to our Supabase instance
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  try {
    const supabaseHost = new URL(supabaseUrl).host;
    const valueHost = new URL(trimmed).host;
    return valueHost === supabaseHost;
  } catch {
    return false;
  }
}

function isMissingStorageObjectError(error: { message?: string; statusCode?: string | number } | null) {
  if (!error) return false;

  const statusCode = typeof error.statusCode === 'string' ? Number.parseInt(error.statusCode, 10) : error.statusCode;
  const message = error.message?.toLowerCase() || '';

  return statusCode === 404 || message.includes('not found') || message.includes('does not exist');
}

export async function DELETE(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: missing or invalid bearer token' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: failed to resolve authenticated user' },
        { status: 401 }
      );
    }

    let body: DeleteJobBody;
    try {
      body = (await request.json()) as DeleteJobBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
    if (!jobId) {
      return NextResponse.json({ error: 'Missing required field: jobId' }, { status: 400 });
    }

    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('id,user_id,subtitle_file,output_video')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: fetchError?.message || 'Job not found' },
        { status: fetchError?.code === 'PGRST116' ? 404 : 500 }
      );
    }

    const row = job as JobStorageRow;
    const storageTargets: StorageTarget[] = [];
    const subtitlePath = normalizeStoragePath(row.subtitle_file, 'subtitles');
    const outputVideoPath = normalizeStoragePath(row.output_video, 'videos');

    if (subtitlePath) {
      assertUserOwnedPath(subtitlePath, user.id, 'subtitles', jobId, row, row.subtitle_file);
      storageTargets.push({ bucket: 'subtitles', path: subtitlePath });
    }

    console.log('[API /jobs/delete] output_video:', row.output_video);
    console.log('[API /jobs/delete] isSupabaseStoragePath:', isSupabaseStoragePath(row.output_video));

    if (outputVideoPath && isSupabaseStoragePath(row.output_video)) {
      assertUserOwnedPath(outputVideoPath, user.id, 'videos', jobId, row, row.output_video);
      storageTargets.push({ bucket: 'videos', path: outputVideoPath });
    } else if (outputVideoPath) {
      console.log(`[API /jobs/delete] Skipping storage deletion for external output_video URL: ${row.output_video}`);
    }

    const deletedStorageObjects: StorageTarget[] = [];
    const missingStorageObjects: StorageTarget[] = [];

    for (const target of storageTargets) {
      console.log('Storage Operation', {
        bucket: target.bucket,
        path: target.path,
        operation: 'remove',
        userId: user.id,
      });
      console.log('Storage Path:', target.path);
      const { error } = await supabase.storage.from(target.bucket).remove([target.path]);

      if (error) {
        if (isMissingStorageObjectError(error)) {
          // It's already gone, which is fine for cleanup
          missingStorageObjects.push(target);
          continue;
        }

        console.error(`[API /jobs/delete] Failed to remove "${target.path}" from "${target.bucket}":`, error);
        return NextResponse.json(
          {
            error: `Failed to delete ${target.bucket} file: ${error.message}`,
            bucket: target.bucket,
            path: target.path,
          },
          { status: 500 }
        );
      }

      deletedStorageObjects.push(target);
    }

    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message, code: deleteError.code },
        { status: deleteError.code === '42501' ? 403 : 500 }
      );
    }

    return NextResponse.json({
      data: {
        deletedJobId: jobId,
        deletedStorageObjects,
        missingStorageObjects,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.startsWith('Refusing to delete') ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
