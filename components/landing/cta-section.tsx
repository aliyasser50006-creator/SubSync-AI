'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-32 sm:py-40 border-y border-border/40">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.15),transparent_70%)] opacity-60" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]" />
      
      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Ready to upgrade your workflow?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Join thousands of modern video professionals who trust SubSync AI to deliver pixel-perfect subtitles in record time.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" asChild className="w-full sm:w-auto rounded-full shadow-glow font-bold h-14 px-8">
              <Link href="/register">
                Start your free trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="w-full sm:w-auto rounded-full font-bold h-14 px-8 border-border/60 hover:bg-muted/50 backdrop-blur-sm transition-all">
              <Link href="/login">Sign in to workspace</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
