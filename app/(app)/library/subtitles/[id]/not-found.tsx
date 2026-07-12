import Link from 'next/link';
import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubtitleNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Subtitle Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The subtitle you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Button asChild className="mt-6">
        <Link href="/library/subtitles">Back to Subtitles Library</Link>
      </Button>
    </div>
  );
}
