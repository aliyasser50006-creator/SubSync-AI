import { Activity, BarChart3, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalyticsSection() {
  return (
    <div className="mt-6 space-y-4 opacity-70 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Analytics (Coming Soon)</h3>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-background/40 shadow-none border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">—</div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/40 shadow-none border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">—</div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 shadow-none border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Completion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">—</div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 shadow-none border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Last Viewed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">—</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
