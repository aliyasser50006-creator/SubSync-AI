import Link from 'next/link';
import { ArrowLeft, FileSearch } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function VideoDetailsNotFound() {
  return (
    <div className="app-page">
      <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-dashed border-border bg-background/45 px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-glow">
          <FileSearch className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight">Video Not Found</h1>
        <p className="mb-8 text-muted-foreground">
          This video does not exist, was deleted, or is not available to your account.
        </p>
        <Button asChild size="lg">
          <Link href="/library?page=1">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Library
          </Link>
        </Button>
      </div>
    </div>
  );
}
