import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  applicationName: 'SubSync AI',
  title: {
    default: 'SubSync AI — Professional Subtitle Workspace',
    template: '%s | SubSync AI',
  },
  description:
    'A premium enterprise workspace for previewing, editing, styling, and publishing subtitle tracks for professional video production.',
  manifest: '/manifest.webmanifest',
  metadataBase: new URL('https://subsync.ai'),
  keywords: [
    'subtitle editor',
    'video subtitles',
    'caption workflow',
    'SRT editor',
    'WebVTT converter',
    'subtitle timing',
    'professional captions',
    'video SaaS',
  ],
  authors: [{ name: 'SubSync AI' }],
  creator: 'SubSync AI',
  openGraph: {
    title: 'SubSync AI — Professional Subtitle Workspace',
    description:
      'Upload subtitle files, preview timing, style captions, and manage video processing in one polished enterprise workspace.',
    type: 'website',
    siteName: 'SubSync AI',
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
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
