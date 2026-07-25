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
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Subtitles,
  UserCircle,
  Video,
  Plus,
  Bell,
  Keyboard,
  BarChart,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { AppBrand } from './app-brand';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { getInitials } from '@/lib/utils/format';

const libraryChildren = [
  { href: '/library', label: 'Videos', icon: Video },
  { href: '/library/subtitles', label: 'Subtitles', icon: Subtitles },
];

const topNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, hint: 'Data' },
  { href: '/create', label: 'Create Project', icon: Plus, hint: 'New' },
];

const bottomNavItems = [
  { href: '/my-videos', label: 'My Videos', icon: Video, hint: 'Manage' },
  { href: '/profile', label: 'Profile', icon: UserCircle, hint: 'You' },
  { href: '/settings', label: 'Settings', icon: Settings, hint: 'Account' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
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
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-primary/12 text-primary shadow-xs'
                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
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
            'group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150',
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
          )}
        >
          <span className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </span>
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
              isActive
                ? 'bg-primary/12 text-primary'
                : 'bg-muted/60 text-muted-foreground group-hover:bg-muted'
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
        'flex h-full flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl transition-all duration-250 ease-spring',
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
        'flex items-center border-b border-border/30 px-3 py-3',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && <AppBrand />}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* ── Quick Action ── */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <Link href="/create">
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-surface-hover/50 px-3 py-2 text-[13px] text-muted-foreground transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
              <Plus className="h-3.5 w-3.5" />
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
        <div className="flex justify-center px-2 pt-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/create">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-border/50 text-muted-foreground transition-all duration-150 hover:border-primary/30 hover:text-primary">
                  <Plus className="h-3.5 w-3.5" />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              New Subtitle Job
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* ── Section Label ── */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">Workspace</span>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className={cn(
        'flex-1 space-y-0.5 overflow-y-auto',
        collapsed ? 'px-2 pt-3' : 'px-2 pt-1'
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
                          'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150',
                          isActive
                            ? 'bg-primary/12 text-primary shadow-xs'
                            : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
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
                'group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150',
                isLibraryActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
              )}
              aria-expanded={libraryOpen}
            >
              <span className="flex items-center gap-2.5">
                <Clapperboard className="h-4 w-4" />
                <span className="font-medium">Library</span>
              </span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 text-muted-foreground/60 transition-transform duration-200',
                  libraryOpen ? 'rotate-0' : '-rotate-90'
                )}
              />
            </button>

            {libraryOpen && (
              <div className="mt-0.5 ml-[22px] space-y-0.5 border-l border-border/30 pl-3">
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
                          'group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-all duration-150',
                          isChildActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{child.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!collapsed && (
          <div className="px-4 pt-3 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">Account</span>
          </div>
        )}

        <div className={cn(!collapsed && 'pt-0.5')}>
          {bottomNavItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className={cn(
        'space-y-2 border-t border-border/30 p-2.5',
        collapsed && 'px-2'
      )}>
        {/* Theme toggle */}
        {!collapsed && (
          <div className="flex items-center justify-between rounded-lg bg-surface-hover/50 px-3 py-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Theme</span>
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
          <div className="flex items-center gap-2 rounded-lg bg-surface-hover/50 px-3 py-1.5 text-[11px] text-muted-foreground">
            <Search className="h-3 w-3" />
            <span>Search</span>
            <span className="ml-auto flex gap-0.5">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
            </span>
          </div>
        )}

        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
              {getInitials(user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-foreground">{user.email}</p>
            </div>
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
            collapsed ? 'h-9 w-9 p-0' : 'justify-start h-8 text-[13px]'
          )}
        >
          {signingOut ? (
            <Loader2 className={cn('h-4 w-4 animate-spin', !collapsed && 'mr-2.5')} />
          ) : (
            <LogOut className={cn('h-4 w-4', !collapsed && 'mr-2.5')} />
          )}
          {!collapsed && (signingOut ? 'Signing out...' : 'Sign Out')}
        </Button>
      </div>
    </aside>
  );
}
