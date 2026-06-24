import { Loader2 } from 'lucide-react';

export default function ProfileLoading() {
  return (
    <div className="app-page-narrow">
      <header className="mb-8">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="mt-3 h-9 w-32 rounded bg-muted animate-pulse" />
        <div className="mt-3 h-5 w-72 rounded bg-muted animate-pulse" />
      </header>

      <div className="surface-panel p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="h-20 w-20 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-36 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface-panel p-6 space-y-3">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
