import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type CreateJobBody = {
  title?: string;
  videoUrl?: string;
  subtitleFile?: string;
  subtitleSettings?: Record<string, unknown>;
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

export async function POST(request: Request) {
  try {
    const authorizationHeader = request.headers.get('authorization');
    const token = extractBearerToken(authorizationHeader);

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
      console.error('[API /jobs/create] Auth failed:', {
        message: userError?.message,
        status: userError?.status,
      });
      return NextResponse.json(
        { error: 'Unauthorized: failed to resolve authenticated user' },
        { status: 401 }
      );
    }

    let body: CreateJobBody;
    try {
      body = (await request.json()) as CreateJobBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const normalizedTitle = typeof body.title === 'string' ? body.title.trim() : '';
    const normalizedVideoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.trim() : '';
    const normalizedSubtitleFile = typeof body.subtitleFile === 'string' ? body.subtitleFile.trim() : '';
    const { subtitleSettings } = body;

    if (!normalizedTitle || !normalizedVideoUrl || !normalizedSubtitleFile) {
      return NextResponse.json(
        { error: 'Missing required fields: title, videoUrl, and subtitleFile' },
        { status: 400 }
      );
    }

    if (!isValidVideoUrl(normalizedVideoUrl)) {
      return NextResponse.json({ error: 'Please provide a valid video URL.' }, { status: 400 });
    }

    const insertPayload = {
      user_id: user.id,
      title: normalizedTitle,
      video_url: normalizedVideoUrl,
      subtitle_file: normalizedSubtitleFile,
      subtitle_settings: subtitleSettings ?? {},
      status: 'ready',
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[API /jobs/create] Insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId: user.id,
        payloadUserId: insertPayload.user_id,
      });

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === '42501' ? 403 : 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('[API /jobs/create] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
