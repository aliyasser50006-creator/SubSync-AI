import { Metadata } from 'next';
import { Subtitles as SubtitlesIcon } from 'lucide-react';
import { SubtitlesLibraryClient } from '@/components/subtitles/library/subtitles-library-client';

export const metadata: Metadata = {
  title: 'Subtitles Library – SubSync AI',
  description: 'Browse, search, and manage all your subtitle files in one place.',
};

export default function SubtitlesPage() {
  return (
    <div className="app-page space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SubtitlesIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Subtitles Library</h1>
            <p className="text-sm text-muted-foreground">Manage your subtitle files</p>
          </div>
        </div>
      </div>

      <SubtitlesLibraryClient />
    </div>
  );
}
