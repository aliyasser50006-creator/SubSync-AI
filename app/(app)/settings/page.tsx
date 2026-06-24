'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { getInitials, formatDate } from '@/lib/utils/format';


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
      toast.success('Password updated successfully.');
    }

    setLoading(false);
  };

  return (
    <div className="app-page-narrow">
      <header className="mb-8">
        <div className="eyebrow">Workspace preferences</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Manage your profile, appearance, and account security.
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Your visible workspace identity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground shadow-soft">
                {getInitials(user?.email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{user?.email || 'Signed in user'}</p>
                <p className="mt-1 text-sm text-muted-foreground">Member since {formatDate(user?.created_at)}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                Active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Core account details connected to Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">Email changes are not enabled for this workspace yet.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Preferences
            </CardTitle>
            <CardDescription>Appearance is persisted locally for this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/45 p-4">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="mt-1 text-xs text-muted-foreground">Switch between dark, light, and system mode.</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>Keep your account secure with a fresh password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {message && (
                <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
