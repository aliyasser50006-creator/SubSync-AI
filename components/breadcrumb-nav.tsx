'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  library: 'Library',
  search: 'Search',
  subtitles: 'Subtitles',
  'my-videos': 'My Videos',
  profile: 'Profile',
  settings: 'Settings',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  // `video` is a structural route segment, not a video ID and not a navigable page.
  // Never emit `/library/video`, because the legacy `/library/[id]` route would read
  // that URL as `{ id: "video" }`.
  const isVideoDetailsRoute =
    segments.length === 3 &&
    segments[0] === 'library' &&
    segments[1] === 'video' &&
    UUID_PATTERN.test(segments[2]);

  const crumbs = isVideoDetailsRoute
    ? [
        { href: '/library', label: 'Library', isLast: false },
        { href: pathname, label: 'Video Details', isLast: true },
      ]
    : segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const label = routeLabels[segment] || (
          UUID_PATTERN.test(segment)
            ? 'Details'
            : segment.charAt(0).toUpperCase() + segment.slice(1)
        );
        return { href, label, isLast };
      });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="rounded-md px-1.5 py-1 font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
