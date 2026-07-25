'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Loader2, ShieldCheck, Sparkles, Subtitles, Wand2, Zap } from 'lucide-react';

import { AppBrand } from '@/components/app-brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { createClient } from '@/lib/supabase/client';

const features = [
  { icon: Film, title: 'Realtime Video Studio', description: 'Preview subtitles synced to any video source' },
  { icon: Wand2, title: 'Visual Style Editor', description: 'Customize fonts, colors, and positioning live' },
  { icon: ShieldCheck, title: 'Enterprise Security', description: 'End-to-end encrypted sessions via Supabase' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* ── Background Grid & Ambient Glow ── */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.18] dark:opacity-15" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <div className="h-[700px] w-[900px] rounded-full bg-primary/12 blur-[160px]" />
      </div>
      <div className="absolute bottom-0 right-0">
        <div className="h-[400px] w-[500px] rounded-full bg-primary/6 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_440px] lg:gap-16 lg:px-8">
        {/* ── Left Panel — Feature Showcase ── */}
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <AppBrand />

            <div className="mt-14 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Professional subtitle operations
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-[1.1] tracking-tight text-foreground">
              Your subtitle workflow,{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                tuned for production.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Sign in to preview videos, align captions, and manage processing jobs from a focused studio workspace.
            </p>

            <div className="mt-12 space-y-4">
              {features.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="glass-panel flex items-center gap-4 p-4 animate-fade-up transition-all duration-200 hover:border-primary/30 hover:shadow-soft hover:-translate-y-0.5 cursor-default"
                    style={{ animationDelay: `${idx * 120}ms` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Right Panel — Login Form ── */}
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
                <Subtitles className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue building caption-ready videos.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
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
                <Label htmlFor="login-password">Password</Label>
                <PasswordInput
                  id="login-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              New to SubSync?{' '}
              <Link href="/register" className="font-semibold text-primary transition-colors hover:text-primary/80">
                Create an account
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground/75">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </section>
      </div>
    </main>
  );
}
