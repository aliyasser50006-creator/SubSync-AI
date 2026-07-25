'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: "How does the AI synchronization work?",
    answer: "Our engine uses advanced voice activity detection (VAD) and speech-to-text models to analyze the audio waveform of your video. It then automatically maps each text cue to the exact millisecond the words are spoken, eliminating manual timestamping."
  },
  {
    question: "Do you train your AI on my private videos?",
    answer: "Absolutely not. We maintain a strict zero-retention policy for our AI models. Your videos are processed securely, and the data is never used to train or improve our algorithms."
  },
  {
    question: "What formats can I export my subtitles in?",
    answer: "You can download industry-standard SRT and WebVTT files directly. If you prefer hardcoded subtitles, our built-in FFmpeg engine allows you to burn the subtitles directly onto the video track and download the final MP4."
  },
  {
    question: "Can I customize the appearance of the subtitles?",
    answer: "Yes. Our editor gives you full control over typography, including font size, text color, outline width, background color, and screen positioning. You can preview these changes in real-time."
  },
  {
    question: "Is there a limit on video length or file size?",
    answer: "Free tier users can process videos up to 10 minutes in length and 500MB in size. Premium users enjoy significantly higher limits to accommodate feature-length films and massive raw uploads."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 sm:py-32 bg-surface-hover/30 border-y border-border/40">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about the product and billing.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={cn(
                  "rounded-2xl border transition-colors duration-200 overflow-hidden",
                  isOpen ? "bg-card border-border-strong shadow-sm" : "bg-transparent border-border/40 hover:border-border/80"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-foreground">{faq.question}</span>
                  <ChevronDown 
                    className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-300",
                      isOpen && "rotate-180 text-primary"
                    )} 
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
