import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Database, 
  FileVideo, 
  LayoutDashboard, 
  Plus,
  Subtitles,
  Activity,
  FolderOpen,
  ArrowRight,
  PlaySquare,
  Library,
  Zap,
  HardDrive,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsCharts } from '@/components/analytics/analytics-charts';

export const metadata: Metadata = {
  title: 'Overview – SubSync AI',
  description: 'Executive overview of your SubSync AI workspace.',
};

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  
  // Real System Health Checks
  let dbStatus = 'Operational';
  let storageStatus = 'Operational';
  let authStatus = 'Operational';
  
  // Ping DB
  try {
    const { error } = await supabase.from('jobs').select('id', { count: 'exact', head: true }).limit(1);
    if (error) throw error;
  } catch {
    dbStatus = 'Degraded';
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    authStatus = 'Degraded';
  }

  let totalJobs = 0;
  let successJobs = 0;
  let failedJobs = 0;
  let processingJobs = 0;
  
  let totalVideosCount = 0;
  let totalSubtitlesCount = 0;
  let totalStorageBytes = 0;
  let largestFileBytes = 0;
  
  let recentJobs: any[] = [];
  
  let jobsByDay: { date: string; count: number }[] = [];
  let statusDistribution: { status: string; count: number }[] = [];

  if (user) {
    // Ping Storage
    try {
      const { error } = await supabase.storage.from('subtitles').list(user.id, { limit: 1 });
      if (error) throw error;
    } catch {
      storageStatus = 'Degraded';
    }

    // Performance Optimization: Promise.all for independent queries
    const [
      jobsResult,
      subtitlesStorageResult,
      videosStorageResult
    ] = await Promise.all([
      // 1. Fetch all jobs metadata for counts, charts, and recent activity
      supabase.from('jobs').select('id, title, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      // 2. Fetch subtitles storage directly from Supabase Storage
      supabase.storage.from('subtitles').list(user.id, { limit: 500 }),
      // 3. Fetch videos storage directly from Supabase Storage
      supabase.storage.from('videos').list(user.id, { limit: 500 })
    ]);

    // -- Process Jobs --
    if (jobsResult.data) {
      const allJobs = jobsResult.data;
      totalJobs = allJobs.length;
      recentJobs = allJobs.slice(0, 5);
      
      successJobs = allJobs.filter(j => j.status === 'done' || j.status === 'ready').length;
      failedJobs = allJobs.filter(j => j.status === 'failed').length;
      processingJobs = allJobs.filter(j => j.status === 'processing' || j.status === 'pending').length;

      // Status Distribution Chart
      const statuses = ['done', 'ready', 'processing', 'pending', 'failed'];
      statusDistribution = statuses.map(status => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: allJobs.filter(j => j.status === status).length
      }));

      // Upload Activity (Last 30 Days) Chart
      const dateCounts = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateCounts.set(dateStr, 0);
      }

      allJobs.forEach(job => {
        if (job.created_at) {
          const d = new Date(job.created_at);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (dateCounts.has(dateStr)) {
            dateCounts.set(dateStr, dateCounts.get(dateStr)! + 1);
          }
        }
      });
      jobsByDay = Array.from(dateCounts.entries()).map(([date, count]) => ({ date, count }));
    }

    // -- Process Storage --
    const calculateBucket = (data: any[] | null) => {
      let count = 0;
      let size = 0;
      if (data) {
        for (const file of data) {
          if (file.name !== '.emptyFolderPlaceholder') {
            count++;
            const fileSize = file.metadata?.size || 0;
            size += fileSize;
            if (fileSize > largestFileBytes) largestFileBytes = fileSize;
          }
        }
      }
      return { count, size };
    };

    const subs = calculateBucket(subtitlesStorageResult.data);
    const vids = calculateBucket(videosStorageResult.data);
    
    totalSubtitlesCount = subs.count;
    totalVideosCount = vids.count;
    totalStorageBytes = subs.size + vids.size;
  }

  // Calculate Success Rate
  const successRate = totalJobs > 0 ? Math.round((successJobs / totalJobs) * 100) : 0;
  
  // AI Insights Logic
  let insights = [];
  if (totalJobs === 0 && totalStorageBytes === 0) {
    insights.push("Not enough data yet to generate insights.");
  } else {
    if (successRate > 90) {
      insights.push(`Exceptional performance! ${successRate}% of your jobs completed successfully.`);
    } else if (failedJobs > 0) {
      insights.push(`You have ${failedJobs} failed jobs. Check the Library for details.`);
    }
    
    if (largestFileBytes > 0) {
      insights.push(`Your largest uploaded file is ${formatBytes(largestFileBytes)}.`);
    }
    
    if (totalVideosCount > totalSubtitlesCount) {
      insights.push("You have more videos than subtitles. Create a new job to generate subtitles for your pending videos.");
    }
    
    if (insights.length === 0) {
       insights.push("Your workspace is running smoothly.");
    }
  }

  return (
    <div className="app-page space-y-10 animate-fade-up max-w-[1400px] mx-auto">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <LayoutDashboard className="h-3.5 w-3.5" /> Workspace Overview
          </div>
          <h1 className="page-title mt-3">
            Welcome back to SubSync
          </h1>
          <p className="page-description mt-2">
            Your executive summary of workspace activity and storage usage.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="shadow-md btn-gradient">
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* ── High-Level Metrics ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="surface-panel p-4 flex flex-col items-start col-span-2 lg:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Projects</span>
          <span className="text-2xl font-bold mt-1">{totalJobs > 0 ? totalJobs : '0'}</span>
        </div>
        <div className="surface-panel p-4 flex flex-col items-start col-span-2 lg:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Videos</span>
          <span className="text-2xl font-bold mt-1">{totalVideosCount > 0 ? totalVideosCount : '0'}</span>
        </div>
        <div className="surface-panel p-4 flex flex-col items-start col-span-2 lg:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subtitles</span>
          <span className="text-2xl font-bold mt-1">{totalSubtitlesCount > 0 ? totalSubtitlesCount : '0'}</span>
        </div>
        <div className="surface-panel p-4 flex flex-col items-start col-span-2 lg:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Storage Used</span>
          <span className="text-2xl font-bold mt-1">{totalStorageBytes > 0 ? formatBytes(totalStorageBytes) : '0 B'}</span>
        </div>
        <div className="surface-panel p-4 flex flex-col items-start col-span-2 lg:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Success Rate</span>
          <span className="text-2xl font-bold mt-1 text-success">{totalJobs > 0 ? `${successRate}%` : 'N/A'}</span>
        </div>
        <div className="surface-panel p-4 flex flex-col items-start col-span-2 lg:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In Progress</span>
          <span className="text-2xl font-bold mt-1 text-warning">{processingJobs > 0 ? processingJobs : '0'}</span>
        </div>
      </div>

      {/* ── Summary Charts ── */}
      {totalJobs > 0 && (
        <AnalyticsCharts jobsByDay={jobsByDay} statusDistribution={statusDistribution} />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Quick Actions ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1.5 rounded-full bg-primary" />
            <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/create" className="group surface-panel p-5 hover:border-primary/40 transition-all flex flex-col items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Create Project</h3>
                <p className="text-xs text-muted-foreground mt-1">Start a new workflow.</p>
              </div>
            </Link>

            <Link href="/library" className="group surface-panel p-5 hover:border-primary/40 transition-all flex flex-col items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Browse Library</h3>
                <p className="text-xs text-muted-foreground mt-1">View all completed jobs.</p>
              </div>
            </Link>
            
            <Link href="/library/subtitles" className="group surface-panel p-5 hover:border-primary/40 transition-all flex flex-col items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Manage Subtitles</h3>
                <p className="text-xs text-muted-foreground mt-1">Edit subtitle files.</p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* ── System Status ── */}
            <div className="surface-panel p-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" /> System Health
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Database</span>
                  {dbStatus === 'Operational' ? <span className="text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Operational</span> : <span className="text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> Degraded</span>}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Storage</span>
                  {storageStatus === 'Operational' ? <span className="text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Operational</span> : <span className="text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> Degraded</span>}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Authentication</span>
                  {authStatus === 'Operational' ? <span className="text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Operational</span> : <span className="text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> Degraded</span>}
                </div>
              </div>
            </div>

            {/* ── AI Insights ── */}
            <div className="surface-panel p-5 bg-gradient-to-br from-card to-primary/5">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-primary" /> AI Insights
              </h3>
              <ul className="space-y-2">
                {insights.map((insight, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1.5 rounded-full bg-primary" />
              <h2 className="text-lg font-bold text-foreground">Recent Projects</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/library">View all</Link>
            </Button>
          </div>

          <div className="surface-panel p-1">
            {recentJobs.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/40">
                {recentJobs.map((job) => (
                  <Link 
                    key={job.id} 
                    href={`/library/video/${job.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-surface-hover/50 transition-colors group rounded-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {job.status === 'done' ? <PlaySquare className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {job.title || 'Untitled Project'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 capitalize flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${job.status === 'done' ? 'bg-success' : job.status === 'failed' ? 'bg-destructive' : 'bg-warning animate-pulse'}`} />
                        {job.status}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                <Database className="h-8 w-8 text-muted-foreground/30" />
                No projects found.
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/create">Start your first project</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
