'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  Clapperboard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Sparkles,
  Subtitles,
  UserCircle,
  Video,
  Plus,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { AppBrand } from './app-brand';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
  const [collapsed, setCollapsed] = useState(false);

  const isLibraryActive =
    pathname === '/library' ||
    pathname.startsWith('/library/');

  const [libraryOpen, setLibraryOpen] = useState(isLibraryActive);

  useEffect(() => {
    if (isLibraryActive) {
      setLibraryOpen(true);
    }
  }, [isLibraryActive]);

  const NavItem = ({ item }: { item: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; hint: string } }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={item.href}>
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link href={item.href}>
        <div
          className={cn(
            'group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
            isActive
              ? 'border-l-2 border-l-primary bg-primary/12 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <span className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span className="font-medium">{item.label}</span>
          </span>
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
              isActive
                ? 'bg-primary/15 text-primary'
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
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border/50 bg-card/60 backdrop-blur-xl transition-all duration-200 ease-spring',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* ── Header ── */}
      <div className={cn(
        'flex items-center border-b border-border/40 p-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && <AppBrand />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* ── Quick Action ── */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/50 px-3 py-2.5 text-sm text-muted-foreground transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
              <Plus className="h-4 w-4" />
              <span className="font-medium">New Subtitle Job</span>
              <span className="ml-auto flex gap-0.5">
                <span className="kbd">⌘</span>
                <span className="kbd">N</span>
              </span>
            </div>
          </Link>
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center px-2 pt-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/dashboard">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground transition-all duration-150 hover:border-primary/40 hover:text-primary">
                  <Plus className="h-4 w-4" />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              New Subtitle Job
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className={cn(
        'flex-1 space-y-1 overflow-y-auto pt-4',
        collapsed ? 'px-2' : 'px-3'
      )} aria-label="Primary navigation">
        {topNavItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}

        {/* Library collapsible group */}
        {collapsed ? (
          <>
            {libraryChildren.map((child) => {
              const Icon = child.icon;
              const isActive =
                child.href === '/library'
                  ? pathname === '/library' || (pathname.startsWith('/library/') && !pathname.startsWith('/library/subtitles'))
                  : pathname.startsWith(child.href);
              return (
                <Tooltip key={child.href}>
                  <TooltipTrigger asChild>
                    <Link href={child.href}>
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150',
                          isActive
                            ? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {child.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </>
        ) : (
          <div>
            <button
              onClick={() => setLibraryOpen((prev) => !prev)}
              className={cn(
                'group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                isLibraryActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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
              <div className="mt-0.5 ml-4 space-y-0.5 border-l border-border/40 pl-3">
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
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                          isChildActive
                            ? 'border-l-2 border-l-primary bg-primary/12 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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
        )}

        <div className="pt-2">
          {bottomNavItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className={cn(
        'space-y-3 border-t border-border/40 p-3',
        collapsed && 'px-2'
      )}>
        {/* Theme toggle */}
        {!collapsed && (
          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/30 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        )}

        {/* Cmd+K hint */}
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <span className="ml-auto flex gap-0.5">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
            </span>
          </div>
        )}

        {/* Sign out */}
        <Button
          onClick={async () => {
            setSigningOut(true);
            await signOut();
          }}
          variant="ghost"
          disabled={signingOut}
          className={cn(
            'w-full text-muted-foreground hover:text-foreground',
            collapsed ? 'h-10 w-10 p-0' : 'justify-start'
          )}
        >
          {signingOut ? (
            <Loader2 className={cn('h-4 w-4 animate-spin', !collapsed && 'mr-3')} />
          ) : (
            <LogOut className={cn('h-4 w-4', !collapsed && 'mr-3')} />
          )}
          {!collapsed && (signingOut ? 'Signing out...' : 'Sign Out')}
        </Button>
      </div>
    </aside>
  );
}
