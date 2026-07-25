'use client';

import { motion } from 'framer-motion';
import { Upload, Sparkles, SlidersHorizontal, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HowItWorksSection() {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Media',
      desc: 'Drag and drop your video files into the secure cloud workspace.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Sparkles,
      title: 'AI Processing',
      desc: 'Our engine automatically transcribes audio and aligns timestamps with 99% accuracy.',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: SlidersHorizontal,
      title: 'Refine & Style',
      desc: 'Use the timeline editor to tweak text, adjust alignment, and customize visual styles.',
      color: 'text-brand-violet',
      bg: 'bg-brand-violet/10',
    },
    {
      icon: Download,
      title: 'Instant Export',
      desc: 'Download standard SRT/VTT formats or burn subtitles directly into the video.',
      color: 'text-success',
      bg: 'bg-success/10',
    }
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-surface-hover/30 border-y border-border/40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16 sm:mb-24">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From raw video to perfect subtitles in minutes.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A seamless, end-to-end workflow designed to save you hours of manual labor.
          </p>
        </div>
        
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-border/60" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step Icon Node */}
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-card border border-border/60 shadow-lg mb-6 group transition-transform hover:-translate-y-1">
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl", step.bg)}>
                    <step.icon className={cn("h-7 w-7", step.color)} />
                  </div>
                  {/* Pulse ring on hover */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-primary opacity-0 scale-90 group-hover:scale-105 group-hover:opacity-20 transition-all duration-300" />
                </div>
                
                {/* Step Content */}
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
