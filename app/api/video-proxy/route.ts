import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { normalizeLibraryVideoId } from '@/lib/utils/library-video-route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_REDIRECTS = 5;

const BLOCKED_METADATA_HOSTS = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  '100.100.100.200',
]);

interface ParsedByteRange {
  start: number;
  end: number | null;
}

interface ParsedContentRange {
  start: number;
  end: number;
  total: number | null;
}

function sanitizeUrlForLog(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return '[invalid-url]';
  }
}

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '::1' || host.endsWith('.local')) {
    return true;
  }

  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) {
    return true;
  }

  return false;
}

function isAllowedUpstreamUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const normalizedHost = parsed.hostname.toLowerCase();
    if (BLOCKED_METADATA_HOSTS.has(normalizedHost)) {
      return false;
    }

    if (process.env.NODE_ENV === 'production' && isPrivateOrLoopbackHost(normalizedHost)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function parseByteRangeHeader(rangeHeader: string | null): ParsedByteRange | null {
  if (!rangeHeader) return null;
  const match = rangeHeader.trim().match(/^bytes=(\d+)-(\d*)$/i);
  if (!match) return null;

  const start = Number.parseInt(match[1], 10);
  const end = match[2] ? Number.parseInt(match[2], 10) : null;

  if (!Number.isFinite(start) || start < 0) return null;
  if (end !== null && (!Number.isFinite(end) || end < start)) return null;

  return { start, end };
}

function parseContentRangeHeader(contentRange: string | null): ParsedContentRange | null {
  if (!contentRange) return null;
  const match = contentRange.trim().match(/^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i);
  if (!match) return null;

  const start = Number.parseInt(match[1], 10);
  const end = Number.parseInt(match[2], 10);
  const total = match[3] === '*' ? null : Number.parseInt(match[3], 10);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  if (total !== null && !Number.isFinite(total)) return null;

  return { start, end, total };
}

function resolveMediaContentType(rawContentType: string | null): string | null {
  const normalized = rawContentType?.split(';')[0]?.trim().toLowerCase() || '';

  if (
    normalized.startsWith('text/html') ||
    normalized.startsWith('application/json') ||
    normalized.startsWith('text/plain') ||
    normalized.startsWith('application/xml')
  ) {
    return null;
  }

  if (!normalized || normalized === 'application/octet-stream' || normalized === 'binary/octet-stream') {
    return 'video/mp4';
  }

  return rawContentType!.trim();
}

function sliceByteStream(
  source: ReadableStream<Uint8Array>,
  upstreamStart: number,
  targetStart: number,
  targetEnd: number | null
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  let currentOffset = upstreamStart;
  let closed = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) {
            closed = true;
            controller.close();
            return;
          }

          if (!value || value.byteLength === 0) continue;

          const chunkStart = currentOffset;
          const chunkEnd = currentOffset + value.byteLength - 1;
          currentOffset += value.byteLength;

          if (chunkEnd < targetStart) {
            continue;
          }

          const sliceStart = Math.max(0, targetStart - chunkStart);
          const sliceEnd =
            targetEnd !== null
              ? Math.min(value.byteLength, targetEnd - chunkStart + 1)
              : value.byteLength;

          if (sliceStart < sliceEnd) {
            controller.enqueue(
              sliceStart === 0 && sliceEnd === value.byteLength
                ? value
                : value.subarray(sliceStart, sliceEnd)
            );
          }

          if (targetEnd !== null && currentOffset > targetEnd) {
            closed = true;
            await reader.cancel().catch(() => {});
            controller.close();
            return;
          }

          if (sliceStart < sliceEnd) {
            return;
          }
        }
      } catch (err) {
        if (!closed) {
          closed = true;
          controller.error(err);
        }
      }
    },
    async cancel() {
      closed = true;
      await reader.cancel().catch(() => {});
    },
  });
}

async function fetchWithValidatedRedirects(
  initialUrl: string,
  method: string,
  headers: Headers,
  signal: AbortSignal
): Promise<Response> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!isAllowedUpstreamUrl(currentUrl)) {
      throw new Error('Blocked unsafe upstream video URL');
    }

    const response = await fetch(currentUrl, {
      method,
      headers,
      redirect: 'manual',
      cache: 'no-store',
      signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      await response.body?.cancel().catch(() => {});
      if (!location) {
        return response;
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return response;
  }

  throw new Error('Too many redirects from upstream video URL');
}

async function handleProxyRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = normalizeLibraryVideoId(searchParams.get('jobId'));

  if (!jobId) {
    return NextResponse.json({ error: 'Valid jobId query parameter is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, video_url')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (jobError) {
    console.error('[API /video-proxy] Failed to query job:', jobError.message);
    return NextResponse.json({ error: 'Failed to load video metadata.' }, { status: 500 });
  }

  if (!job?.video_url) {
    return NextResponse.json({ error: 'Video not found.' }, { status: 404 });
  }

  const upstreamUrl = job.video_url.trim();
  if (!isAllowedUpstreamUrl(upstreamUrl)) {
    return NextResponse.json({ error: 'Unsupported or blocked video URL.' }, { status: 400 });
  }

  const incomingRange = request.headers.get('range');
  const parsedRequestedRange = parseByteRangeHeader(incomingRange);

  const upstreamHeaders = new Headers();
  upstreamHeaders.set('Accept', '*/*');
  upstreamHeaders.set('Accept-Encoding', 'identity');
  if (incomingRange) {
    upstreamHeaders.set('Range', incomingRange);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetchWithValidatedRedirects(
      upstreamUrl,
      request.method,
      upstreamHeaders,
      request.signal
    );
  } catch (err) {
    if (request.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      return new NextResponse(null, { status: 499 });
    }
    console.error('[API /video-proxy] Upstream fetch failed:', {
      jobId,
      target: sanitizeUrlForLog(upstreamUrl),
      reason: err instanceof Error ? err.message : 'Unknown network error',
    });
    return NextResponse.json({ error: 'Failed to reach upstream video host.' }, { status: 502 });
  }

  if (!upstreamResponse.ok && upstreamResponse.status !== 206 && upstreamResponse.status !== 304) {
    await upstreamResponse.body?.cancel().catch(() => {});
    const status = [401, 403, 404, 416].includes(upstreamResponse.status)
      ? upstreamResponse.status
      : 502;
    const responseHeaders = new Headers({
      'Cache-Control': 'private, no-store',
    });
    const upstreamContentRange = upstreamResponse.headers.get('content-range');
    if (status === 416 && upstreamContentRange) {
      responseHeaders.set('Content-Range', upstreamContentRange);
    }
    return NextResponse.json(
      { error: `Upstream video host returned HTTP ${upstreamResponse.status}.` },
      { status, headers: responseHeaders }
    );
  }

  if (upstreamResponse.status === 304) {
    await upstreamResponse.body?.cancel().catch(() => {});
    return new NextResponse(null, {
      status: 304,
      headers: {
        'Cache-Control': 'private, no-store, no-transform',
      },
    });
  }

  const contentType = resolveMediaContentType(upstreamResponse.headers.get('content-type'));
  if (!contentType) {
    await upstreamResponse.body?.cancel().catch(() => {});
    console.warn('[API /video-proxy] Upstream returned non-media content type:', {
      jobId,
      target: sanitizeUrlForLog(upstreamUrl),
      contentType: upstreamResponse.headers.get('content-type'),
    });
    return NextResponse.json(
      { error: 'Upstream server returned an error page instead of a playable video stream.' },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', contentType);
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Cache-Control', 'private, no-store, no-transform');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');

  const etag = upstreamResponse.headers.get('etag');
  if (etag) responseHeaders.set('ETag', etag);

  const lastModified = upstreamResponse.headers.get('last-modified');
  if (lastModified) responseHeaders.set('Last-Modified', lastModified);

  const upstreamContentRange = upstreamResponse.headers.get('content-range');
  const parsedUpstreamRange = parseContentRangeHeader(upstreamContentRange);
  const upstreamLengthHeader = upstreamResponse.headers.get('content-length');
  const upstreamLength = upstreamLengthHeader ? Number.parseInt(upstreamLengthHeader, 10) : null;

  // Handle servers that ignore non-zero Range offsets and return bytes from 0.
  if (parsedRequestedRange && parsedRequestedRange.start > 0 && upstreamResponse.body) {
    const upstreamStart = parsedUpstreamRange ? parsedUpstreamRange.start : 0;

    if (upstreamStart < parsedRequestedRange.start) {
      const totalSize =
        parsedUpstreamRange?.total ??
        (upstreamResponse.status === 200 && upstreamLength !== null && Number.isFinite(upstreamLength)
          ? upstreamLength
          : null);

      if (totalSize !== null && parsedRequestedRange.start >= totalSize) {
        await upstreamResponse.body.cancel().catch(() => {});
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
            'Cache-Control': 'private, no-store',
          },
        });
      }

      const maxAvailableEnd =
        parsedUpstreamRange?.end ?? (totalSize !== null ? totalSize - 1 : null);
      const effectiveEnd =
        parsedRequestedRange.end !== null && maxAvailableEnd !== null
          ? Math.min(parsedRequestedRange.end, maxAvailableEnd)
          : parsedRequestedRange.end ?? maxAvailableEnd;

      if (effectiveEnd !== null) {
        const slicedLength = effectiveEnd - parsedRequestedRange.start + 1;
        const totalLabel = totalSize !== null ? String(totalSize) : '*';
        responseHeaders.set(
          'Content-Range',
          `bytes ${parsedRequestedRange.start}-${effectiveEnd}/${totalLabel}`
        );
        responseHeaders.set('Content-Length', String(slicedLength));

        if (request.method === 'HEAD') {
          await upstreamResponse.body.cancel().catch(() => {});
          return new NextResponse(null, {
            status: 206,
            headers: responseHeaders,
          });
        }

        const slicedStream = sliceByteStream(
          upstreamResponse.body,
          upstreamStart,
          parsedRequestedRange.start,
          effectiveEnd
        );

        return new NextResponse(slicedStream, {
          status: 206,
          headers: responseHeaders,
        });
      }
    }
  }

  if (upstreamResponse.status === 206 && upstreamContentRange) {
    responseHeaders.set('Content-Range', upstreamContentRange);
  }

  if (upstreamLengthHeader) {
    responseHeaders.set('Content-Length', upstreamLengthHeader);
  }

  if (request.method === 'HEAD') {
    await upstreamResponse.body?.cancel().catch(() => {});
    return new NextResponse(null, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request) {
  return handleProxyRequest(request);
}

export async function HEAD(request: Request) {
  return handleProxyRequest(request);
}
