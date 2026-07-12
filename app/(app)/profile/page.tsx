'use client';

import Link from 'next/link';
import { CalendarDays, Mail, Settings, Sparkles, ShieldCheck, Award, ArrowUpRight } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth-context';
import { getInitials, formatDate } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="app-page-narrow space-y-8 animate-fade-up">
      <header className="border-b border-border/40 pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Identity & Workspace
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
          Operator Profile
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Manage your enterprise workstation credentials, visual theme preferences, and access permissions.
        </p>
      </header>

      {/* Main Profile Identity Banner */}
      <div className="surface-panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
              {getInitials(user?.email)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="truncate text-2xl font-bold text-foreground">{user?.email || 'SubSync User'}</h2>
                <Badge variant="outline" className="border-success/30 bg-success/15 text-success font-semibold text-xs px-2.5 py-0.5 shadow-xs">
                  Active Member
                </Badge>
              </div>
              <p className="mt-1 text-xs font-mono text-muted-foreground">User ID: {user?.id || 'Unknown'}</p>
            </div>
          </div>

          <Button asChild variant="secondary" className="font-semibold shadow-xs hover:bg-accent shrink-0">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4 text-primary" />
              Account Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics & Preferences 3-column Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Primary Email</span>
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground truncate" title={user?.email}>
            {user?.email || 'Unavailable'}
          </p>
          <p className="text-[11px] text-muted-foreground">Verified identity contact</p>
        </div>

        <div className="surface-panel p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Registration</span>
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground font-mono">
            {formatDate(user?.created_at)}
          </p>
          <p className="text-[11px] text-muted-foreground">Account activation timestamp</p>
        </div>

        <div className="surface-panel p-5 space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Interface Mode</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-foreground">Theme Toggle</span>
            <ThemeToggle />
          </div>
          <p className="text-[11px] text-muted-foreground">DAW contrast preference</p>
        </div>
      </div>

      {/* Workspace Permission Level */}
      <div className="surface-panel p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Workspace Permissions & Tier</h3>
              <p className="text-xs text-muted-foreground">Security level and feature entitlements</p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs bg-card px-2.5 py-1">
            Enterprise Pro Tier
          </Badge>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/40 p-4 sm:p-5 text-sm text-foreground/90 leading-relaxed">
          Your account is authorized for full AI subtitle synthesis, real-time audio synchronization engines, unlimited video project storage, and priority render queue scheduling.
        </div>
      </div>
    </div>
  );
}
