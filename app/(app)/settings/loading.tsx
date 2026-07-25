export default function SettingsLoading() {
  return (
    <div className="app-page-narrow">
      <header className="mb-8">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="mt-3 h-9 w-28 rounded bg-muted animate-pulse" />
        <div className="mt-3 h-5 w-80 rounded bg-muted animate-pulse" />
      </header>

      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="surface-panel p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-muted animate-pulse" />
              <div className="h-5 w-24 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
