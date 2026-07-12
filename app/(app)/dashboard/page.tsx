import { Metadata } from 'next';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard – SubSync AI',
  description: 'Create polished subtitle previews in one flow.',
};

export default function DashboardPage() {
  return (
    <div className="app-page">
      {/* ── Hero Header ── */}
      <div className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="eyebrow">Caption Studio</div>
            <h1 className="page-title mt-3">
              Create subtitle previews
            </h1>
            <p className="page-description mt-3">
              Upload SRT files, tune the caption style, and preview with realtime job updates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="kbd">⌘</span>
              <span className="kbd">↵</span>
              <span className="ml-1">to create</span>
            </div>
            <div className="inline-flex items-center rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
              SRT → VTT auto-convert
            </div>
          </div>
        </div>
      </div>

      <DashboardClient />
    </div>
  );
}
