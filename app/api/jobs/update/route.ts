import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type UpdateJobBody = {
  jobId?: string;
  title?: string;
  videoUrl?: string;
};

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1]?.trim();
  return token ? token : null;
}

function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
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

    let body: UpdateJobBody;
    try {
      body = (await request.json()) as UpdateJobBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const videoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.trim() : '';

    if (!jobId || !title || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, title, and videoUrl' },
        { status: 400 }
      );
    }

    if (!isValidVideoUrl(videoUrl)) {
      return NextResponse.json({ error: 'Please provide a valid video URL.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({
        title,
        video_url: videoUrl,
      })
      .eq('id', jobId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === 'PGRST116' ? 404 : error.code === '42501' ? 403 : 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('[API /jobs/update] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
