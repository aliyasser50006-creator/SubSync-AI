'use client';

import { Calendar, CheckCircle2, Clock, FileText, Info, Settings2, ShieldAlert, Sliders, ExternalLink } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Job } from '@/lib/types/database';

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
      return (
        <Badge className="border-success/30 bg-success/15 text-success hover:bg-success/20 font-semibold px-2.5 py-0.5 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Ready
        </Badge>
      );
    case 'processing':
    case 'pending':
      return (
        <Badge className="border-primary/30 bg-primary/15 text-primary hover:bg-primary/20 font-semibold px-2.5 py-0.5 animate-pulse shadow-xs">
          <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0 animate-spin" /> Processing
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/20 font-semibold px-2.5 py-0.5 shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Failed
        </Badge>
      );
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
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(job.created_at));

  const hostname = (() => {
    try {
      return new URL(job.video_url).hostname.replace(/^www\./, '');
    } catch {
      return 'Media Stream';
    }
  })();

  const fileFormat = job.subtitle_file?.endsWith('.vtt')
    ? 'VTT (WebVTT Format)'
    : job.subtitle_file?.endsWith('.srt')
      ? 'SRT (SubRip Format)'
      : 'Attached Track';

  return (
    <Accordion type="multiple" defaultValue={['settings', 'info']} className="w-full space-y-4">
      {/* Subtitle Workstation Settings */}
      <AccordionItem value="settings" className="surface-panel overflow-hidden border border-border/60 shadow-soft p-0">
        <AccordionTrigger className="px-5 py-4 text-sm font-bold text-foreground hover:no-underline bg-card/60 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Sliders className="h-4 w-4" />
            </div>
            <span>Playback & Sync Studio</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-5 space-y-6 bg-card/30">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/50">
            <div>
              <p className="text-sm font-semibold text-foreground">Subtitle Overlay</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subtitlesEnabled ? 'Live rendering enabled' : 'Overlay muted'}
              </p>
            </div>
            <Switch checked={subtitlesEnabled} onCheckedChange={onSubtitlesEnabledChange} />
          </div>

          <div className="space-y-3 p-3 rounded-xl border border-border/40 bg-background/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Audio Sync Offset</p>
                <p className="text-xs text-muted-foreground mt-0.5">Adjust timing alignment</p>
              </div>
              <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20">
                {subtitleDelaySeconds > 0 ? '+' : ''}
                {subtitleDelaySeconds.toFixed(1)}s
              </span>
            </div>
            <Slider
              value={[subtitleDelaySeconds]}
              min={-5}
              max={5}
              step={0.1}
              onValueChange={([val]) => onSubtitleDelayChange(val)}
              disabled={!subtitlesEnabled}
              className={!subtitlesEnabled ? 'opacity-40' : 'pt-2'}
            />
          </div>

          <div className="space-y-3 p-3 rounded-xl border border-border/40 bg-background/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Typography Size</p>
                <p className="text-xs text-muted-foreground mt-0.5">Scale rendered text size</p>
              </div>
              <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20">
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
              className={!subtitlesEnabled ? 'opacity-40' : 'pt-2'}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Project Metadata Information */}
      <AccordionItem value="info" className="surface-panel overflow-hidden border border-border/60 shadow-soft p-0">
        <AccordionTrigger className="px-5 py-4 text-sm font-bold text-foreground hover:no-underline bg-card/60 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Info className="h-4 w-4" />
            </div>
            <span>Asset Specifications</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-5 space-y-4 text-xs font-mono bg-card/30">
          <div className="grid grid-cols-1 gap-4 divide-y divide-border/30">
            <div className="pt-1 first:pt-0">
              <p className="font-sans font-semibold text-muted-foreground text-[11px] uppercase tracking-wider mb-1.5">
                AI Pipeline Status
              </p>
              <div>{getStatusBadge(job.status)}</div>
              {job.error_message && (
                <div className="mt-2 text-xs font-sans text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/30 leading-relaxed">
                  {job.error_message}
                </div>
              )}
            </div>

            <div className="pt-3">
              <p className="font-sans font-semibold text-muted-foreground text-[11px] uppercase tracking-wider mb-1">
                Ingested Timestamp
              </p>
              <div className="flex items-center gap-2 text-foreground font-sans text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formattedCreated}</span>
              </div>
            </div>

            <div className="pt-3">
              <p className="font-sans font-semibold text-muted-foreground text-[11px] uppercase tracking-wider mb-1">
                Origin Media Host
              </p>
              <div className="truncate font-sans text-sm" title={job.video_url}>
                <a
                  href={job.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                >
                  <span>{hostname}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            </div>

            {job.subtitle_file && (
              <div className="pt-3">
                <p className="font-sans font-semibold text-muted-foreground text-[11px] uppercase tracking-wider mb-1">
                  Attached Track Format
                </p>
                <div className="flex items-center gap-2 text-foreground font-sans text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">{fileFormat}</span>
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
