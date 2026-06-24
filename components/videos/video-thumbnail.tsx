'use client';

import Image from 'next/image';
import { useEffect, useState, useMemo, memo } from 'react';
import { FileVideo } from 'lucide-react';

import { cn } from '@/lib/utils';

interface VideoThumbnailProps {
  title: string;
  url: string;
  className?: string;
  iconClassName?: string;
}

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const watchId = parsed.searchParams.get('v');
      if (watchId) return watchId;

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' && parts[1]) return parts[1];
      if (parts[0] === 'embed' && parts[1]) return parts[1];
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeThumbnail(url: string) {
  const youtubeId = getYouTubeVideoId(url);
  if (!youtubeId) return null;

  return {
    src: `https://i.ytimg.com/vi_webp/${youtubeId}/hqdefault.webp`,
    fallbackSrc: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
  };
}

export const VideoThumbnail = memo(function VideoThumbnail({
  title,
  url,
  className,
  iconClassName = 'h-7 w-7',
}: VideoThumbnailProps) {
  const thumbnail = useMemo(() => getYouTubeThumbnail(url), [url]);
  const [imageSrc, setImageSrc] = useState(thumbnail?.src || null);

  useEffect(() => {
    setImageSrc(thumbnail?.src || null);
  }, [thumbnail?.src]);

  return (
    <div className={cn('absolute inset-0 flex items-center justify-center bg-slate-950', className)}>
      {thumbnail && imageSrc ? (
        <Image
          src={imageSrc}
          alt={`${title} thumbnail`}
          fill
          sizes="(max-width: 640px) 96px, 148px"
          loading="lazy"
          className="object-cover"
          onError={() => {
            if (imageSrc !== thumbnail.fallbackSrc) {
              setImageSrc(thumbnail.fallbackSrc);
            }
          }}
        />
      ) : (
        <FileVideo className={cn('text-slate-500', iconClassName)} />
      )}
    </div>
  );
});
