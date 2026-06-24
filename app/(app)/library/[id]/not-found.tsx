import Link from 'next/link';
import { FileSearch, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LibraryDetailNotFound() {
  return (
    <div className="app-page">
      <div className="rounded-xl border border-dashed border-border bg-background/45 px-6 py-20 text-center max-w-2xl mx-auto mt-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-glow mb-6">
          <FileSearch className="h-10 w-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Video Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The video you are looking for does not exist, has been deleted, or you do not have permission to view it.
        </p>
        
        <Button asChild size="lg">
          <Link href="/library">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Library
          </Link>
        </Button>
      </div>
    </div>
  );
}
