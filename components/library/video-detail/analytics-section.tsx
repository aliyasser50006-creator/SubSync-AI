import { Activity, BarChart3, Eye, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalyticsSection() {
  return (
    <div className="surface-panel overflow-hidden border border-border/60 shadow-soft p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Audience Insights</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Preview
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/40 shadow-xs border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Views</CardTitle>
            <Eye className="h-3.5 w-3.5 text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-foreground/70">—</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 shadow-xs border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Watch Time</CardTitle>
            <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-foreground/70">—</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 shadow-xs border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Completion</CardTitle>
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-foreground/70">—</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 shadow-xs border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Engagement</CardTitle>
            <Activity className="h-3.5 w-3.5 text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold font-mono text-foreground/70">—</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
