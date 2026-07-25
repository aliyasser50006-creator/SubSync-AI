'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-panel w-full max-w-lg p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold">Something interrupted the workspace</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || 'The page could not finish rendering. Try again to reload the current view.'}
        </p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
