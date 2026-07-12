import Link from 'next/link';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoDetailErrorProps {
  error: string;
  onRetry?: () => void;
}

export function VideoDetailError({ error, onRetry }: VideoDetailErrorProps) {
  return (
    <div className="app-page">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center max-w-2xl mx-auto mt-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Failed to load video</h3>
        <p className="text-muted-foreground text-sm mb-8">{error}</p>
        
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/library">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Link>
          </Button>
          
          {onRetry && (
            <Button onClick={onRetry}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
