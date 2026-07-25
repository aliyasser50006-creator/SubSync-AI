'use client';

import { motion } from 'framer-motion';
import { 
  Zap,
  LayoutDashboard,
  Type,
  MonitorPlay,
  Wand2,
  Lock,
  Globe2
} from 'lucide-react';

export function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16 sm:mb-20">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need. Nothing you don't.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-8">
            Designed for speed and reliability, SubSync AI packs professional-grade tools into a remarkably intuitive interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 auto-rows-[minmax(180px,auto)]">
          {/* Bento Box 1: Large Feature */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 md:row-span-2 rounded-3xl bg-card border border-border/50 p-8 shadow-sm flex flex-col justify-between overflow-hidden relative group hover:border-border-strong hover:shadow-md transition-all"
          >
            <div className="relative z-10 max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-6">
                <MonitorPlay className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Real-Time HTML5 Rendering</h3>
              <p className="text-muted-foreground leading-relaxed">
                Experience zero-latency playback. Our proprietary HTML5 engine renders your subtitles directly onto the video in real-time, matching exactly what the final export will look like.
              </p>
            </div>
            {/* Visual Element Mock */}
            <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-slate-950 rounded-tl-xl border-t border-l border-border/40 transform translate-x-8 translate-y-8 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500 shadow-2xl flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-30" />
               <div className="bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 rounded-lg text-white font-bold text-sm shadow-xl z-10">
                 Instant Visual Feedback
               </div>
            </div>
          </motion.div>

          {/* Bento Box 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl bg-card border border-border/50 p-8 shadow-sm flex flex-col relative overflow-hidden group hover:border-border-strong hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-violet/10 mb-5">
              <Wand2 className="h-5 w-5 text-brand-violet" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">AI Synchronization</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Drop the manual adjustments. Our AI detects voice activity and automatically aligns every cue to the millisecond.
            </p>
          </motion.div>

          {/* Bento Box 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl bg-card border border-border/50 p-8 shadow-sm flex flex-col relative overflow-hidden group hover:border-border-strong hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 mb-5">
              <Type className="h-5 w-5 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Advanced Styling</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Total control over fonts, colors, outlines, and backgrounds. Perfect for matching brand guidelines.
            </p>
          </motion.div>

          {/* Bento Box 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-3xl bg-card border border-border/50 p-8 shadow-sm flex flex-col relative overflow-hidden group hover:border-border-strong hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 mb-5">
              <Zap className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Blazing Fast</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A workspace optimized for performance. Keyboard shortcuts for every action ensure you never have to touch your mouse.
            </p>
          </motion.div>

          {/* Bento Box 5: Wide Feature */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="md:col-span-2 rounded-3xl bg-card border border-border/50 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group hover:border-border-strong hover:shadow-md transition-all"
          >
            <div className="flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 mb-5">
                <Lock className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Enterprise Security</h3>
              <p className="text-muted-foreground leading-relaxed text-sm max-w-sm">
                Your pre-release assets are safe. We use bank-grade encryption, secure isolated cloud storage buckets, and strictly enforce data privacy. We never train AI on your private videos.
              </p>
            </div>
            <div className="w-full md:w-64 h-32 bg-muted/50 rounded-xl border border-border/60 flex items-center justify-center group-hover:bg-muted transition-colors relative overflow-hidden">
               {/* Abstract security visual */}
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent)]" />
               <Lock className="h-12 w-12 text-blue-500/40" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
