'use client';

import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProblemSolutionSection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-sm font-semibold leading-7 text-primary uppercase tracking-widest">
            The New Standard
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Stop struggling with broken workflows.
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Traditional subtitling requires bouncing between multiple tools, guessing timings, and slow exports. SubSync AI changes everything.
          </p>
        </div>

        <div className="mx-auto max-w-5xl grid md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          {/* Before Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 shadow-sm"
          >
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </span>
              The Old Way
            </h3>
            <ul className="space-y-4">
              {[
                'Manually transcribing audio tracks',
                'Guessing timestamps and alignments',
                'Bouncing between 3 different tools',
                'No real-time preview rendering',
                'Painful export and format conversions'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm font-medium">
                  <XCircle className="h-5 w-5 text-destructive/50 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border/60 shadow-elevated z-10 mx-auto"
          >
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </motion.div>

          {/* After Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-success/30 bg-success/5 p-8 shadow-md ring-1 ring-success/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 blur-[50px] rounded-full" />
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </span>
              SubSync AI
            </h3>
            <ul className="space-y-4 relative z-10">
              {[
                'Instant AI transcription & sync',
                'Pixel-perfect automatic alignment',
                'All-in-one browser workspace',
                'Live HTML5 playback engine',
                'One-click format exports'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-foreground text-sm font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
