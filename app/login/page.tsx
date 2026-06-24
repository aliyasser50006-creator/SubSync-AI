'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Loader2, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';

import { AppBrand } from '@/components/app-brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

const valueProps = [
  { icon: Film, label: 'Realtime video workspace' },
  { icon: Wand2, label: 'Subtitle styling preview' },
  { icon: ShieldCheck, label: 'Secure Supabase sessions' },
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
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <AppBrand />
            <div className="mt-14 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Premium caption operations
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight">
              Your subtitle workflow, tuned for production.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Sign in to preview videos, align captions, and manage processing jobs from a focused studio workspace.
            </p>
            <div className="mt-10 grid max-w-lg gap-3">
              {valueProps.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="surface-panel flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-4 flex items-center justify-between lg:justify-end">
            <div className="lg:hidden">
              <AppBrand compact />
            </div>
            <ThemeToggle />
          </div>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to continue building caption-ready videos.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              <div className="mt-5 text-center text-sm text-muted-foreground">
                New to SubSync?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
