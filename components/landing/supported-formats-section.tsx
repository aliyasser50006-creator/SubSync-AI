'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  FileVideo,
  FileAudio,
  MonitorPlay,
  Share2,
  Cpu
} from 'lucide-react';

export function SupportedFormatsSection() {
  const formats = [
    { icon: FileVideo, label: 'MP4 / MOV' },
    { icon: FileText, label: 'SRT / WebVTT' },
    { icon: Cpu, label: 'FFmpeg Engine' },
    { icon: Share2, label: 'Export Ready' },
    { icon: FileAudio, label: 'Audio Extract' },
    { icon: MonitorPlay, label: 'HTML5 Render' },
  ];

  return (
    <section className="border-y border-border/40 bg-surface-hover/30 py-12 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-0">
        <p className="text-xs font-semibold text-muted-foreground mb-8 uppercase tracking-[0.2em]">
          Enterprise-Grade Compatibility
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60">
          {formats.map((format, i) => (
            <motion.div
              key={format.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-100"
            >
              <format.icon className="h-5 w-5" />
              <span className="text-base font-bold tracking-tight">{format.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
