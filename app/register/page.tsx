'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, Sparkles, Subtitles, UploadCloud, Zap } from 'lucide-react';

import { AppBrand } from '@/components/app-brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const onboardingSteps = [
  { label: 'Upload SRT files', description: 'Drag & drop your subtitle files' },
  { label: 'Preview caption timing', description: 'Sync subtitles with video playback' },
  { label: 'Export video-ready results', description: 'Download polished captioned videos' },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, label: 'Weak', color: 'bg-destructive' };
  if (score === 2) return { score: 40, label: 'Fair', color: 'bg-warning' };
  if (score === 3) return { score: 60, label: 'Good', color: 'bg-warning' };
  if (score === 4) return { score: 80, label: 'Strong', color: 'bg-success' };
  return { score: 100, label: 'Excellent', color: 'bg-success' };
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const strength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (!data.session) {
      // Email confirmation required — BUG-02 fix
      setError('');
      setLoading(false);
      router.push('/login?message=check_email');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* ── Background Grid & Ambient Glow ── */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.18] dark:opacity-15" />
      <div className="absolute right-0 top-0">
        <div className="h-[700px] w-[700px] rounded-full bg-success/10 blur-[160px]" />
      </div>
      <div className="absolute left-0 bottom-0">
        <div className="h-[400px] w-[500px] rounded-full bg-primary/6 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_440px] lg:gap-16 lg:px-8">
        {/* ── Left Panel — Onboarding Steps ── */}
        <section className="hidden lg:block">
          <AppBrand />
          <div className="mt-14 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/8 px-3.5 py-1.5 text-sm font-medium text-success">
              <UploadCloud className="h-3.5 w-3.5" />
              Start in minutes
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-[1.1] tracking-tight text-foreground">
              Build a cleaner{' '}
              <span className="bg-gradient-to-r from-success to-success/60 bg-clip-text text-transparent">
                caption pipeline.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Create a workspace for uploads, subtitle styling, previews, and processing feedback with a modern dashboard.
            </p>

            <div className="mt-12 space-y-4">
              {onboardingSteps.map((step, index) => (
                <div
                  key={step.label}
                  className="glass-panel flex items-center gap-4 p-4 animate-fade-up transition-all duration-200 hover:border-success/30 hover:shadow-soft hover:-translate-y-0.5 cursor-default"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success ring-1 ring-success/25">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-[11px] font-bold text-success ring-1 ring-success/25">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Right Panel — Register Form ── */}
        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:justify-end">
            <div className="lg:hidden">
              <AppBrand compact />
            </div>
            <ThemeToggle />
          </div>

          <div className="glass-panel-elevated p-8 animate-fade-up">
            <div className="mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">Create your workspace</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Set up your account and start preparing captioned videos.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <PasswordInput
                  id="register-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'rounded-full transition-all duration-300',
                          strength.color
                        )}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <p className={cn(
                      'text-xs font-medium',
                      strength.score <= 40 ? 'text-destructive' :
                      strength.score <= 60 ? 'text-warning' :
                      'text-success'
                    )}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm">Confirm Password</Label>
                <PasswordInput
                  id="register-confirm"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>

              {error && (
                <div className="animate-fade-in rounded-xl border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="btn-gradient h-11 w-full text-sm font-semibold" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary transition-colors hover:text-primary/80">
                Sign in
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground/75">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </section>
      </div>
    </main>
  );
}
