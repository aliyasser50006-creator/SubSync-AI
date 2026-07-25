import { Metadata } from 'next';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { PlusCircle, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Create Project – SubSync AI',
  description: 'Create a new subtitle synchronization project.',
};

export default function CreateProjectPage() {
  return (
    <div className="app-page space-y-8 animate-fade-up max-w-[1400px] mx-auto">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <PlusCircle className="h-3.5 w-3.5" /> New Project
          </div>
          <h1 className="page-title mt-2">
            Create a New Subtitle Job
          </h1>
          <p className="page-description mt-2 max-w-xl">
            Upload your source video and subtitle files to generate a perfectly synchronized preview. Configure styles and styling parameters in the right panel.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <DashboardClient />
      </div>
    </div>
  );
}
