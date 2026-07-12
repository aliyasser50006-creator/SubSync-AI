import { NextResponse } from 'next/server';
import { getSubtitleById } from '@/lib/actions/subtitles';

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path')?.trim();
  if (!path) {
    return NextResponse.json({ error: 'Subtitle path required' }, { status: 400 });
  }

  const subtitleId = Buffer.from(path).toString('base64url');
  const { data, error } = await getSubtitleById(subtitleId);
  if (error || !data) {
    return NextResponse.json({ error: error || 'Subtitle not found' }, { status: 404 });
  }

  const contentType = data.format === 'vtt' ? 'text/vtt' : 'application/x-subrip';
  return new NextResponse(data.subtitle_content, {
    status: 200,
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Cache-Control': 'private, no-store',
    },
  });
}
