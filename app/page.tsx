'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { Subtitles } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Timeout fallback — redirect to login after 10s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
      router.push('/login?error=session_expired');
    }, 10000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Brand Emblem */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-glow animate-pulse-glow">
          <Subtitles className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">SubSync AI</h1>
          <p
            className="text-sm text-muted-foreground animate-fade-in"
            role="status"
            aria-live="polite"
          >
            {showTimeout ? 'Redirecting to login...' : 'Verifying secure workspace...'}
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/40"
              style={{
                animation: `status-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
