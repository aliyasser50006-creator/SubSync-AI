'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  Clapperboard,
  LayoutDashboard,
  Video,
  Subtitles,
  Settings,
  LogOut,
  Menu,
  UserCircle,
  X,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from './ui/button';
import { AppBrand } from './app-brand';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils/format';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const libraryItems = [
  { href: '/library', label: 'Videos', icon: Video },
  { href: '/library/subtitles', label: 'Subtitles', icon: Subtitles },
];

const otherNavItems = [
  { href: '/my-videos', label: 'My Videos', icon: Video },
  { href: '/profile', label: 'Profile', icon: UserCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalOverscrollBehavior = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overscrollBehavior = originalOverscrollBehavior;
    };
  }, [isOpen]);

  const isLibraryChildActive = (href: string) => {
    if (href === '/library') {
      return pathname === '/library' || (pathname.startsWith('/library/') && !pathname.startsWith('/library/subtitles'));
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Top Bar ── */}
      <div className="fixed left-0 right-0 top-0 z-50 flex min-h-14 items-center justify-between border-b border-border/30 bg-card/90 px-3 py-2 backdrop-blur-xl lg:hidden sm:px-4">
        <AppBrand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-10 w-10 text-foreground"
            aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* ── Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer Panel ── */}
      {isOpen && (
        <div className="mobile-nav-panel fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto border-r border-border/30 bg-card/95 pt-16 backdrop-blur-xl lg:hidden">
          {/* Quick Action */}
          <div className="p-3">
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-surface-hover/50 px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                <Plus className="h-4 w-4" />
                <span className="font-medium">New Subtitle Job</span>
              </div>
            </Link>
          </div>

          <nav className="space-y-0.5 px-2" aria-label="Mobile navigation">
            {/* Section label */}
            <div className="px-3 pt-2 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">Workspace</span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Library group */}
            <div className="pt-2">
              <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
                <Clapperboard className="h-3 w-3" />
                Library
              </div>
              <div className="ml-3 space-y-0.5 border-l border-border/30 pl-3">
                {libraryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isLibraryChildActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] transition-all duration-150',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section label */}
            <div className="px-3 pt-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">Account</span>
            </div>

            <div>
              {otherNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] transition-all duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ── Footer ── */}
          <div className="sticky bottom-0 left-0 right-0 mt-6 space-y-2 border-t border-border/30 bg-card/95 p-3 backdrop-blur-xl">
            {/* User info */}
            {user && (
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {getInitials(user.email)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{user.email}</p>
                </div>
              </div>
            )}

            <Button
              onClick={async () => {
                setSigningOut(true);
                await signOut();
                setIsOpen(false);
              }}
              variant="ghost"
              disabled={signingOut}
              className="min-h-11 w-full justify-start text-muted-foreground hover:text-foreground text-[13px]"
            >
              {signingOut ? (
                <Loader2 className="mr-2.5 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2.5 h-4 w-4" />
              )}
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
