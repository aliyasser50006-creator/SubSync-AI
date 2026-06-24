import { Metadata } from 'next';
import { MonitorPlay, FileText, Sparkles } from 'lucide-react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard – SubSync AI',
  description: 'Create polished subtitle previews in one flow.',
};

export default function DashboardPage() {
  return (
    <div className="app-page">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="eyebrow">Caption studio</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Create polished subtitle previews in one flow.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Upload one or more SRT files, tune the caption style, and preview the video with realtime job updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border border-border/70 bg-card/70 px-3 py-2">Ctrl/Cmd + Enter to create</span>
          <span className="rounded-md border border-border/70 bg-card/70 px-3 py-2">SRT converted to VTT</span>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          { label: 'Input', value: 'Ready', icon: MonitorPlay },
          { label: 'Subtitles', value: 'Drop files below', icon: FileText },
          { label: 'Status', value: 'Standing by', icon: Sparkles },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="surface-panel flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <DashboardClient />
    </div>
  );
}
