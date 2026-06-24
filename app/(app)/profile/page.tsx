'use client';

import Link from 'next/link';
import { CalendarDays, Mail, Settings, Sparkles, UserCircle } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/auth-context';
import { getInitials, formatDate } from '@/lib/utils/format';


export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="app-page-narrow">
      <header className="mb-8">
        <div className="eyebrow">User profile</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Profile</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          A clean profile view for your account identity and workspace preferences.
        </p>
      </header>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary text-2xl font-semibold text-primary-foreground shadow-glow">
              {getInitials(user?.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-2xl font-semibold">{user?.email || 'SubSync user'}</p>
              <p className="mt-2 text-sm text-muted-foreground">Subtitle workflow operator</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, label: 'Email', value: user?.email || 'Unavailable' },
          { icon: CalendarDays, label: 'Member since', value: formatDate(user?.created_at) },
          { icon: Sparkles, label: 'Theme', value: <ThemeToggle /> },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  {item.label}
                </CardTitle>
                <CardDescription className="truncate">
                  {item.label === 'Theme' ? 'Local preference' : 'Account detail'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm font-medium">{item.value}</CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            Workspace Role
          </CardTitle>
          <CardDescription>Profile metadata can grow here as teams and roles are added.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/60 bg-background/45 p-4 text-sm text-muted-foreground">
            You currently have access to upload subtitles, preview videos, manage jobs, and update account security.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
