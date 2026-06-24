'use client';

import { Calendar, CheckCircle2, Clock, FileText, Info, Settings2, ShieldAlert } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Job, SubtitleSettings } from '@/lib/types/database';

interface VideoInfoSidebarProps {
  job: Job;
  subtitlesEnabled: boolean;
  onSubtitlesEnabledChange: (enabled: boolean) => void;
  subtitleDelaySeconds: number;
  onSubtitleDelayChange: (delay: number) => void;
  subtitleFontSize: number;
  onSubtitleFontSizeChange: (size: number) => void;
}

function getStatusBadge(status: Job['status']) {
  switch (status) {
    case 'done':
    case 'ready':
      return <Badge className="border-success/25 bg-success/10 text-success hover:bg-success/20"><CheckCircle2 className="w-3.5 h-3.5 mr-1"/> Ready</Badge>;
    case 'processing':
    case 'pending':
      return <Badge className="border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 animate-pulse"><Clock className="w-3.5 h-3.5 mr-1"/> Processing</Badge>;
    case 'failed':
      return <Badge className="border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/20"><ShieldAlert className="w-3.5 h-3.5 mr-1"/> Failed</Badge>;
    default:
      return null;
  }
}

export function VideoInfoSidebar({
  job,
  subtitlesEnabled,
  onSubtitlesEnabledChange,
  subtitleDelaySeconds,
  onSubtitleDelayChange,
  subtitleFontSize,
  onSubtitleFontSizeChange,
}: VideoInfoSidebarProps) {
  const formattedCreated = new Intl.DateTimeFormat(undefined, { 
    dateStyle: 'medium', timeStyle: 'short' 
  }).format(new Date(job.created_at));

  const hostname = (() => {
    try { return new URL(job.video_url).hostname; } catch { return 'Unknown source'; }
  })();

  const fileFormat = job.subtitle_file?.endsWith('.vtt') ? 'VTT' : job.subtitle_file?.endsWith('.srt') ? 'SRT' : 'Unknown';

  return (
    <Accordion type="multiple" defaultValue={["info", "settings"]} className="w-full">
      
      {/* Information Panel */}
      <AccordionItem value="info" className="border-border/60 bg-background/50 px-4 rounded-lg mb-4">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Video Information
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2 pb-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">Status</p>
              <div>{getStatusBadge(job.status)}</div>
              {job.error_message && (
                <p className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                  {job.error_message}
                </p>
              )}
            </div>

            <div>
              <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">Uploaded</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {formattedCreated}
              </div>
            </div>

            <div>
              <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">Source</p>
              <div className="truncate" title={job.video_url}>
                <a href={job.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {hostname}
                </a>
              </div>
            </div>

            {job.subtitle_file && (
              <div>
                <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">Subtitle File</p>
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  {fileFormat} format
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Settings Panel */}
      <AccordionItem value="settings" className="border-border/60 bg-background/50 px-4 rounded-lg mb-4">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Subtitle Settings
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6 pt-2 pb-4">
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Show Subtitles</p>
              <p className="text-xs text-muted-foreground">{subtitlesEnabled ? 'Visible on player' : 'Hidden from player'}</p>
            </div>
            <Switch checked={subtitlesEnabled} onCheckedChange={onSubtitlesEnabledChange} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Sync Delay</p>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">
                {subtitleDelaySeconds > 0 ? '+' : ''}{subtitleDelaySeconds.toFixed(1)}s
              </span>
            </div>
            <Slider
              value={[subtitleDelaySeconds]}
              min={-5}
              max={5}
              step={0.1}
              onValueChange={([val]) => onSubtitleDelayChange(val)}
              disabled={!subtitlesEnabled}
              className={!subtitlesEnabled ? 'opacity-50' : ''}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Font Size</p>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">
                {subtitleFontSize}px
              </span>
            </div>
            <Slider
              value={[subtitleFontSize]}
              min={16}
              max={48}
              step={1}
              onValueChange={([val]) => onSubtitleFontSizeChange(val)}
              disabled={!subtitlesEnabled}
              className={!subtitlesEnabled ? 'opacity-50' : ''}
            />
          </div>

        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
