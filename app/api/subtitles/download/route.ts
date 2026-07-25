import { NextResponse } from 'next/server';
import { getSubtitleById } from '@/lib/actions/subtitles';

function safeFilename(value: string): string {
  return value.replace(/[\r\n"\\/:*?<>|]+/g, '_').trim() || 'subtitle';
}

export async function GET(request: Request) {
  const subtitleId = new URL(request.url).searchParams.get('id')?.trim();
  if (!subtitleId) {
    return NextResponse.json({ error: 'Subtitle ID required' }, { status: 400 });
  }

  const { data, error } = await getSubtitleById(subtitleId);
  if (error || !data) {
    return NextResponse.json({ error: error || 'Subtitle not found' }, { status: 404 });
  }

  const contentType = data.format === 'vtt' ? 'text/vtt' : 'application/x-subrip';
  const filename = `${safeFilename(data.title)}.${data.format}`;

  return new NextResponse(data.subtitle_content, {
    status: 200,
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
