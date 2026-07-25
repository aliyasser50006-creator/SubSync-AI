'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import { Subtitles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBrand } from '@/components/app-brand';

// Landing Page Sections
import { HeroSection } from '@/components/landing/hero-section';
import { SupportedFormatsSection } from '@/components/landing/supported-formats-section';
import { ProblemSolutionSection } from '@/components/landing/problem-solution-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { FAQSection } from '@/components/landing/faq-section';
import { CTASection } from '@/components/landing/cta-section';
import { FooterSection } from '@/components/landing/footer-section';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Preserve redirect behavior for authenticated users
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-glow animate-pulse-glow">
            <Subtitles className="h-8 w-8 text-primary" />
          </div>
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

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* ── Navigation ── */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <AppBrand />
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hidden sm:block"
            >
              Sign In
            </Link>
            <Button asChild className="rounded-full shadow-glow font-semibold px-6">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <HeroSection />
        <SupportedFormatsSection />
        <ProblemSolutionSection />
        <HowItWorksSection />
        
        <div id="features">
          <FeaturesSection />
        </div>
        
        <div id="faq">
          <FAQSection />
        </div>
        
        <CTASection />
      </main>

      <FooterSection />
    </div>
  );
}
