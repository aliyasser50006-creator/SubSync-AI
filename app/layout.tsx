import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  applicationName: 'SubSync AI',
  title: {
    default: 'SubSync AI - Subtitle Video Workspace',
    template: '%s | SubSync AI',
  },
  description:
    'A premium workspace for previewing, styling, and preparing subtitle tracks for video publishing.',
  manifest: '/manifest.webmanifest',
  metadataBase: new URL('https://subsync.ai'),
  keywords: ['subtitle editor', 'video subtitles', 'caption workflow', 'SRT', 'video SaaS'],
  authors: [{ name: 'SubSync AI' }],
  creator: 'SubSync AI',
  openGraph: {
    title: 'SubSync AI',
    description:
      'Upload subtitle files, preview timing, style captions, and manage video processing in one polished workspace.',
    type: 'website',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

import Providers from '@/components/providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider>
            <TooltipProvider delayDuration={150}>
              <AuthProvider>{children}</AuthProvider>
              <Toaster richColors closeButton position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
