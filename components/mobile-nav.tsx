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
  Search,
} from 'lucide-react';
import { Button } from './ui/button';
import { AppBrand } from './app-brand';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

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
  const { signOut } = useAuth();

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
      <div className="fixed left-0 right-0 top-0 z-50 flex min-h-14 items-center justify-between border-b border-border/40 bg-card/90 px-3 py-2 backdrop-blur-xl lg:hidden sm:px-4">
        <AppBrand />
        <div className="flex items-center gap-1">
          <ThemeToggle className="h-10 w-10" />
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
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer Panel ── */}
      {isOpen && (
        <div className="mobile-nav-panel fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto border-r border-border/40 bg-card/95 pt-16 backdrop-blur-xl lg:hidden">
          {/* Quick Action */}
          <div className="p-3">
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/50 px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                <Plus className="h-4 w-4" />
                <span className="font-medium">New Subtitle Job</span>
              </div>
            </Link>
          </div>

          <nav className="space-y-1 px-3" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-150',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Library group */}
            <div className="pt-2">
              <div className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                <Clapperboard className="h-3.5 w-3.5" />
                Library
              </div>
              <div className="ml-3 space-y-0.5 border-l border-border/40 pl-3">
                {libraryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isLibraryChildActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-150',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              {otherNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-150',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ── Footer ── */}
          <div className="sticky bottom-0 left-0 right-0 mt-6 border-t border-border/40 bg-card/95 p-3 backdrop-blur-xl">
            <Button
              onClick={async () => {
                setSigningOut(true);
                await signOut();
                setIsOpen(false);
              }}
              variant="ghost"
              disabled={signingOut}
              className="min-h-11 w-full justify-start text-muted-foreground hover:text-foreground"
            >
              {signingOut ? (
                <Loader2 className="mr-3 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-3 h-4 w-4" />
              )}
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
