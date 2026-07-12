import { Loader2 } from 'lucide-react';

export default function AppLoading() {
  return (
    <div className="app-page">
      <div className="grid gap-4">
        <div className="surface-panel h-28 animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-panel h-72 animate-pulse" />
          <div className="surface-panel flex h-72 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
