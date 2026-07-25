'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Sparkles, Check, Subtitles, ListVideo, AlignCenter, Languages, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-[120px] pb-24 lg:pt-[180px] lg:pb-32">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 mix-blend-screen bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Announcement Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-8"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md transition-all hover:bg-primary/10 hover:border-primary/30"
            >
              <Sparkles className="h-4 w-4" />
              <span>SubSync AI Engine 2.0 is live</span>
              <span className="mx-2 h-3 w-px bg-primary/20" />
              <span className="flex items-center gap-1">
                Start building <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="max-w-4xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-[80px] leading-[1.1]"
          >
            Perfect subtitles. <br className="hidden sm:block" />
            <span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
              Zero friction.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="mt-8 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
          >
            The fastest, most accurate platform to generate, style, and sync professional subtitles. Built for video teams who demand pixel-perfect precision and enterprise-grade performance.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Button size="xl" asChild className="w-full sm:w-auto rounded-full shadow-glow font-semibold h-14 px-8">
              <Link href="/register">
                Start for free
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="w-full sm:w-auto rounded-full font-semibold h-14 px-8 border-border/60 hover:bg-muted/50 backdrop-blur-sm transition-all">
              <Link href="#how-it-works">
                <PlayCircle className="mr-2 h-5 w-5 opacity-70" />
                See how it works
              </Link>
            </Button>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 flex items-center gap-4 text-xs font-medium text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Free trial included</span>
          </motion.p>
        </div>

        {/* Detailed Application Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 sm:mt-24 w-full max-w-6xl mx-auto"
        >
          {/* Glassmorphic Browser Frame */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-2 shadow-2xl backdrop-blur-xl sm:p-4 ring-1 ring-white/10 dark:ring-white/5">
            <div className="rounded-xl border border-border/60 bg-background overflow-hidden shadow-inner flex flex-col">
              
              {/* Browser Header */}
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                </div>
                <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-background border border-border/50 text-[10px] font-mono text-muted-foreground shadow-xs">
                  app.subsync.ai/project/demo
                </div>
              </div>

              {/* Editor Workspace Mockup */}
              <div className="flex flex-col md:flex-row h-[400px] md:h-[600px] bg-background">
                {/* Sidebar */}
                <div className="hidden md:flex w-16 border-r border-border/40 bg-muted/10 flex-col items-center py-4 gap-6">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary"><Subtitles className="h-4 w-4" /></div>
                  <div className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center"><ListVideo className="h-4 w-4" /></div>
                  <div className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center"><Languages className="h-4 w-4" /></div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Top Toolbar */}
                  <div className="h-12 border-b border-border/40 flex items-center justify-between px-4 bg-background">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-16 bg-muted/60 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-7 w-20 bg-primary/10 rounded border border-primary/20" />
                      <div className="h-7 w-24 bg-primary text-primary-foreground text-[11px] font-bold rounded shadow-xs flex items-center justify-center">Export</div>
                    </div>
                  </div>

                  {/* Video & Subtitle Split */}
                  <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                    {/* Video Player */}
                    <div className="flex-1 border-b lg:border-b-0 lg:border-r border-border/40 bg-slate-950 relative flex items-center justify-center overflow-hidden group">
                       <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity transition-opacity duration-700 group-hover:opacity-60" />
                       
                       {/* Floating Subtitle on Video */}
                       <div className="absolute bottom-12 text-center w-full px-8">
                         <span className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-xl font-bold shadow-lg border border-white/10 tracking-wide">
                           The future of content creation is here.
                         </span>
                       </div>

                       {/* Video Controls Mock */}
                       <div className="absolute bottom-0 w-full h-10 bg-gradient-to-t from-black/80 to-transparent flex items-center px-4 gap-3">
                         <PlayCircle className="h-4 w-4 text-white/80" />
                         <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                           <div className="w-[45%] h-full bg-primary" />
                         </div>
                         <span className="text-[10px] text-white/80 font-mono">01:24 / 03:10</span>
                       </div>
                    </div>

                    {/* Subtitle List panel */}
                    <div className="w-full lg:w-80 bg-background flex flex-col">
                      <div className="p-3 border-b border-border/40 bg-muted/20 font-semibold text-xs flex justify-between">
                        <span>Transcript</span>
                        <span className="text-primary font-mono">102 Cues</span>
                      </div>
                      <div className="flex-1 p-3 space-y-2 overflow-hidden">
                        {[
                          { time: '01:21.000', text: 'Welcome to the platform.', active: false },
                          { time: '01:24.500', text: 'The future of content creation is here.', active: true },
                          { time: '01:28.100', text: 'Let me show you how it works.', active: false },
                          { time: '01:32.400', text: 'Everything is instantly synced.', active: false },
                          { time: '01:36.000', text: 'And beautifully styled.', active: false },
                        ].map((cue, i) => (
                          <div key={i} className={cn("p-2.5 rounded-lg border text-xs transition-colors", cue.active ? "bg-primary/5 border-primary/40 shadow-sm" : "bg-card border-border/40 opacity-70")}>
                            <div className={cn("font-mono text-[10px] mb-1", cue.active ? "text-primary font-bold" : "text-muted-foreground")}>{cue.time}</div>
                            <div className={cn("font-medium", cue.active ? "text-foreground" : "text-foreground/70")}>{cue.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Floating UI Elements for depth */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-6 lg:-right-12 top-32 z-20 hidden md:flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 p-3 shadow-xl backdrop-blur-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Type className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Global Styling</p>
              <p className="text-[10px] text-muted-foreground">Applied to all cues instantly</p>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-6 lg:-left-12 bottom-24 z-20 hidden md:flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 p-3 shadow-xl backdrop-blur-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Perfect Sync</p>
              <p className="text-[10px] text-muted-foreground">99.8% AI alignment accuracy</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
