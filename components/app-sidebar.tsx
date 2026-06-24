'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  Clapperboard,
  ChevronDown,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Subtitles,
  UserCircle,
  Video,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { AppBrand } from './app-brand';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

const libraryChildren = [
  { href: '/library', label: 'Videos', icon: Video },
  { href: '/library/subtitles', label: 'Subtitles', icon: Subtitles },
];

const topNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Create' },
];

const bottomNavItems = [
  { href: '/my-videos', label: 'My Videos', icon: Video, hint: 'Manage' },
  { href: '/profile', label: 'Profile', icon: UserCircle, hint: 'You' },
  { href: '/settings', label: 'Settings', icon: Settings, hint: 'Account' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const isLibraryActive =
    pathname === '/library' ||
    pathname.startsWith('/library/');

  const [libraryOpen, setLibraryOpen] = useState(isLibraryActive);

  useEffect(() => {
    if (isLibraryActive) {
      setLibraryOpen(true);
    }
  }, [isLibraryActive]);

  const renderNavItem = (item: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link key={item.href} href={item.href}>
        <div
          className={cn(
            'group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
            isActive
              ? 'bg-primary text-primary-foreground shadow-soft'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <span className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span className="font-medium">{item.label}</span>
          </span>
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px]',
              isActive
                ? 'bg-primary-foreground/15 text-primary-foreground'
                : 'bg-muted text-muted-foreground group-hover:bg-background/70'
            )}
          >
            {item.hint}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border/70 bg-card/78 backdrop-blur-xl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="flex items-center justify-between border-b border-border/60 p-5">
        <AppBrand />
        <ThemeToggle />
      </div>

      <div className="p-4">
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm shadow-glow">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Studio ready
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Preview, tune, and ship captioned videos from one workspace.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Primary navigation">
        {topNavItems.map(renderNavItem)}

        {/* Library collapsible group */}
        <div>
          <button
            onClick={() => setLibraryOpen((prev) => !prev)}
            className={cn(
              'group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
              isLibraryActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            aria-expanded={libraryOpen}
          >
            <span className="flex items-center gap-3">
              <Clapperboard className="h-4 w-4" />
              <span className="font-medium">Library</span>
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                libraryOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {libraryOpen && (
            <div className="mt-0.5 ml-4 space-y-0.5 border-l border-border/50 pl-3">
              {libraryChildren.map((child) => {
                const Icon = child.icon;
                const isChildActive =
                  child.href === '/library'
                    ? pathname === '/library' || (pathname.startsWith('/library/') && !pathname.startsWith('/library/subtitles'))
                    : pathname.startsWith(child.href);
                return (
                  <Link key={child.href} href={child.href}>
                    <div
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all',
                        isChildActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="font-medium">{child.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {bottomNavItems.map(renderNavItem)}
      </nav>

      <div className="space-y-3 border-t border-border/60 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/45 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-success/15 text-success">
            <FolderOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Workspace</p>
            <p className="truncate text-xs text-muted-foreground">Realtime video jobs</p>
          </div>
        </div>
        <Button
          onClick={async () => {
            setSigningOut(true);
            await signOut();
          }}
          variant="ghost"
          disabled={signingOut}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          {signingOut ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-3 h-4 w-4" />
          )}
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    </aside>
  );
}
