export interface ParsedSubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
  cueIndex?: number;
}

// Millisecond fraction ([.,]\d{1,3}) is optional so that whole-second timestamps
// like "00:02:15 --> 00:02:18" are accepted and defaulted to .000 rather than dropped.
const TIMECODE_PATTERN = /^((?:\d{1,2}:)?\d{2}:\d{2}(?:[.,]\d{1,3})?)\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}(?:[.,]\d{1,3})?)(?:\s+.*)?$/;
const ENCODING_CANDIDATES = ['utf-8', 'windows-1256', 'windows-1252', 'iso-8859-1', 'utf-16le'];

export function normalizeSubtitleText(input: string): string {
  return input
    .replace(/^\uFEFF/, '')
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function detectBomEncoding(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf-16le';
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf-16be';
  }

  return null;
}

function decodeUsingEncoding(bytes: Uint8Array, encoding: string): string | null {
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}

function countMatches(value: string, regex: RegExp): number {
  const matches = value.match(regex);
  return matches ? matches.length : 0;
}

function scoreDecodedSubtitle(value: string): number {
  const replacementCount = countMatches(value, /\uFFFD/g);
  const controlCount = countMatches(value, /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g);
  const mojibakeCount = countMatches(value, /(?:Ã.|â.|Ø.|Ù.|Ð.|Ñ.)/g);

  return replacementCount * 100 + controlCount * 20 + mojibakeCount * 4;
}

export function decodeSubtitleBytes(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) return '';

  const bomEncoding = detectBomEncoding(bytes);
  if (bomEncoding) {
    const decodedWithBom = decodeUsingEncoding(bytes, bomEncoding);
    if (decodedWithBom !== null) {
      return normalizeSubtitleText(decodedWithBom);
    }
  }

  let bestText: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const encoding of ENCODING_CANDIDATES) {
    const decoded = decodeUsingEncoding(bytes, encoding);
    if (decoded === null) continue;

    const normalized = normalizeSubtitleText(decoded);
    const score = scoreDecodedSubtitle(normalized);

    if (score < bestScore) {
      bestScore = score;
      bestText = normalized;
    }

    if (score === 0 && encoding === 'utf-8') {
      break;
    }
  }

  if (bestText !== null) {
    return bestText;
  }

  return normalizeSubtitleText(new TextDecoder().decode(bytes));
}

export async function readSubtitleFileAsText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return decodeSubtitleBytes(buffer);
}

function parseTimestamp(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  const parts = normalized.split(':');

  let hours: number;
  let minutes: number;
  let seconds: number;

  if (parts.length === 3) {
    hours = Number.parseInt(parts[0], 10);
    minutes = Number.parseInt(parts[1], 10);
    seconds = Number.parseFloat(parts[2]);
  } else if (parts.length === 2) {
    hours = 0;
    minutes = Number.parseInt(parts[0], 10);
    seconds = Number.parseFloat(parts[1]);
  } else {
    return null;
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }

  if (hours < 0 || minutes < 0 || seconds < 0) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

// Returns parsed start/end for any line that structurally looks like a timecode arrow
// pair. Leading/trailing whitespace is trimmed before matching so indented lines are
// not silently dropped. We deliberately do NOT reject cues where end <= start here —
// those are passed through to the editor's INVALID_TIMESTAMP validation rule which
// already knows how to flag and auto-fix them.
function parseTimecodeLine(line: string): { start: number; end: number } | null {
  // Trim both ends so a timecode line with leading spaces/tabs still matches the
  // ^-anchored regex (fix: was only trimEnd()'d upstream).
  const match = line.trim().match(TIMECODE_PATTERN);
  if (!match) return null;

  const start = parseTimestamp(match[1]);
  const end = parseTimestamp(match[2]);

  // Only bail out if the timestamp strings are structurally unparseable (null).
  // A cue with end <= start is still a recognisable cue — let the editor's
  // INVALID_TIMESTAMP rule catch it rather than silently discarding it.
  if (start === null || end === null) {
    return null;
  }

  return { start, end };
}

export function parseSubtitleContent(content: string): ParsedSubtitleCue[] {
  const normalized = normalizeSubtitleText(content);
  if (!normalized.trim()) return [];

  const lines = normalized.split('\n');
  const cues: ParsedSubtitleCue[] = [];
  let cueId = 0;
  let cursor = 0;

  while (cursor < lines.length) {
    let line = lines[cursor].trimEnd();

    if (!line.trim()) {
      cursor += 1;
      continue;
    }

    if (line.trim().startsWith('WEBVTT')) {
      cursor += 1;
      continue;
    }

    if (
      line.trim().startsWith('NOTE') ||
      line.trim().startsWith('STYLE') ||
      line.trim().startsWith('REGION')
    ) {
      cursor += 1;

      while (cursor < lines.length && lines[cursor].trim() !== '') {
        cursor += 1;
      }

      continue;
    }

    let cueIndex: number | undefined;

    if (!line.includes('-->') && cursor + 1 < lines.length && lines[cursor + 1].includes('-->')) {
      const rawIndex = line.trim();
      const parsedIndex = Number.parseInt(rawIndex, 10);
      if (Number.isInteger(parsedIndex) && `${parsedIndex}` === rawIndex) {
        cueIndex = parsedIndex;
      }

      cursor += 1;
      line = lines[cursor].trimEnd();
    }

    const timecode = parseTimecodeLine(line);
    if (!timecode) {
      cursor += 1;
      continue;
    }

    cursor += 1;

    const textLines: string[] = [];
    while (cursor < lines.length) {
      const textLine = lines[cursor].replace(/\s+$/g, '');

      // Stop at a blank line (standard SRT cue separator).
      if (textLine.trim() === '') break;

      // Safety boundary: if this line itself is a timecode arrow line, we've
      // reached the start of the next cue without a separating blank line.
      // Break without consuming the line so the outer loop can parse it as a
      // new cue, preventing the next cue's index/timecode/text from being
      // swallowed into the current cue's text.
      if (parseTimecodeLine(textLine) !== null) break;

      textLines.push(textLine);
      cursor += 1;
    }

    // Always push the cue — even when the text is empty or whitespace-only.
    // The editor's EMPTY_TEXT validation rule is already designed to flag and
    // auto-fix blank cues; discarding them here means they silently vanish
    // instead of surfacing in the validation panel.
    const text = textLines.join('\n').trim();
    cues.push({
      id: cueId++,
      start: timecode.start,
      end: timecode.end,
      text,
      cueIndex,
    });

    while (cursor < lines.length && lines[cursor].trim() === '') {
      cursor += 1;
    }
  }

  return cues;
}

function formatVttTimestamp(value: number): string {
  const safeValue = Math.max(0, value);
  const wholeSeconds = Math.floor(safeValue);

  let milliseconds = Math.round((safeValue - wholeSeconds) * 1000);
  let seconds = wholeSeconds % 60;
  const totalMinutes = Math.floor(wholeSeconds / 60);
  let minutes = totalMinutes % 60;
  let hours = Math.floor(totalMinutes / 60);

  if (milliseconds === 1000) {
    milliseconds = 0;
    seconds += 1;

    if (seconds === 60) {
      seconds = 0;
      minutes += 1;

      if (minutes === 60) {
        minutes = 0;
        hours += 1;
      }
    }
  }

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

export function srtToVtt(srt: string): string {
  const cues = parseSubtitleContent(srt);

  if (cues.length === 0) {
    throw new Error('Subtitle file contains no valid cues.');
  }

  const output: string[] = ['WEBVTT', ''];

  for (const cue of cues) {
    output.push(`${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}`);
    output.push(cue.text);
    output.push('');
  }

  return output.join('\n');
}

/**
 * Validates that a URL is well-formed.
 * Accepts any valid URL: YouTube, Vimeo, direct files, and more.
 */
export function validateVideoUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Must be http or https.
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid URL.' };
  }
}

/**
 * Validates that an image URL is well-formed.
 */
export function validateImageUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) return { valid: true };
  try {
    const parsed = new URL(url.trim());
    if (!['http:', 'https:', 'data:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Image URL must use http, https, or data protocol.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid image URL (.png, .webp, .jpg, etc.).' };
  }
}
