import { MonitorPlay, FileText, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="app-page">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-[400px] sm:w-[600px]" />
          <Skeleton className="h-6 w-[300px] sm:w-[500px]" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-8 w-40 rounded-md" />
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          { label: 'Input', value: 'Ready', icon: MonitorPlay },
          { label: 'Subtitles', value: 'Drop files below', icon: FileText },
          { label: 'Status', value: 'Standing by', icon: Sparkles },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary opacity-50">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(400px,1fr)_minmax(500px,1.4fr)] mt-6">
        <div className="space-y-6">
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Skeleton className="h-[450px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </aside>
      </div>
    </div>
  );
}
