'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck, UserCircle, Sparkles, Sliders } from 'lucide-react';
import { toast } from 'sonner';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { getInitials, formatDate } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
      toast.error(error.message);
    } else {
      setMessage('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Security credentials updated successfully.');
    }

    setLoading(false);
  };

  return (
    <div className="app-page-narrow space-y-8 animate-fade-up">
      <header className="border-b border-border/40 pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Sliders className="h-3.5 w-3.5" /> Workspace Configuration
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
          Account Settings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Configure security credentials, interface presentation modes, and workspace identity parameters.
        </p>
      </header>

      <div className="space-y-6">
        {/* Profile Identity Summary */}
        <div className="surface-panel p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <UserCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Active Identity</h3>
                <p className="text-xs text-muted-foreground">Authenticated session parameters</p>
              </div>
            </div>
            <Badge variant="outline" className="border-success/30 bg-success/15 text-success font-semibold text-xs px-2.5 py-0.5">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 inline" /> Active Session
            </Badge>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between pt-1">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                {getInitials(user?.email)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">{user?.email || 'Signed in operator'}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">Joined workspace {formatDate(user?.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Email Information */}
        <div className="surface-panel p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/40 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Contact Email Address</h3>
              <p className="text-xs text-muted-foreground">Primary identity bound to Supabase Auth</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input type="email" value={user?.email || ''} disabled className="bg-background/50 font-mono text-sm h-9" />
            <p className="text-[11px] text-muted-foreground pt-1">Primary email addresses are locked by organization SSO policy.</p>
          </div>
        </div>

        {/* DAW Interface Preferences */}
        <div className="surface-panel p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/40 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Visual Presentation</h3>
              <p className="text-xs text-muted-foreground">Interface theme and DAW workstation contrast</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 p-4">
            <div>
              <p className="text-sm font-bold text-foreground">Color Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Switch between Dark Studio, Light, and System synchronization.</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Security Credentials */}
        <div className="surface-panel p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-border/40 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Security & Password</h3>
              <p className="text-xs text-muted-foreground">Update your session login credentials</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-5 pt-1">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 6 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-9 bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-9 bg-background"
                />
              </div>
            </div>

            {message && (
              <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-medium text-success">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="font-semibold shadow-xs">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Security Key...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
