import { Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubtitleSettings } from '@/lib/types/database';
import { cn } from '@/lib/utils';

interface StylingCardProps {
  settings: SubtitleSettings;
  onSettingsChange: (settings: SubtitleSettings) => void;
}

export function StylingCard({ settings, onSettingsChange }: StylingCardProps) {
  const subtitlePreviewStyle = {
    color: settings.fontColor,
    WebkitTextStroke: `${settings.outlineWidth || 0}px ${settings.outlineColor || '#000000'}`,
    fontSize: `${Math.max(16, Math.min(settings.fontSize || 28, 48))}px`,
  };

  return (
    <Card className="surface-panel transition-all duration-200 hover:border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            <Palette className="h-4 w-4" />
          </div>
          Subtitle Styling
        </CardTitle>
        <CardDescription>Configure caption typography, outline, and layout before rendering.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Font Size</Label>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                {settings.fontSize}px
              </span>
            </div>
            <Slider
              value={[settings.fontSize || 28]}
              onValueChange={([value]) => onSettingsChange({ ...settings, fontSize: value })}
              min={16}
              max={48}
              step={1}
              className="py-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Font Color</Label>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-1.5 shadow-xs">
                <Input
                  type="color"
                  value={settings.fontColor}
                  onChange={(e) => onSettingsChange({ ...settings, fontColor: e.target.value })}
                  className="h-8 w-12 shrink-0 cursor-pointer rounded-lg border-0 p-0"
                />
                <span className="font-mono text-xs uppercase font-medium text-foreground">
                  {settings.fontColor}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Outline Color</Label>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-1.5 shadow-xs">
                <Input
                  type="color"
                  value={settings.outlineColor}
                  onChange={(e) => onSettingsChange({ ...settings, outlineColor: e.target.value })}
                  className="h-8 w-12 shrink-0 cursor-pointer rounded-lg border-0 p-0"
                />
                <span className="font-mono text-xs uppercase font-medium text-foreground">
                  {settings.outlineColor}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Outline Width</Label>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                {settings.outlineWidth}px
              </span>
            </div>
            <Slider
              value={[settings.outlineWidth || 0]}
              onValueChange={([value]) => onSettingsChange({ ...settings, outlineWidth: value })}
              min={0}
              max={5}
              step={1}
              className="py-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vertical Position</Label>
              <Select
                value={settings.position}
                onValueChange={(value: 'top' | 'bottom') => onSettingsChange({ ...settings, position: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">Bottom Third</SelectItem>
                  <SelectItem value="top">Top Third</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Alignment</Label>
              <Select
                value={settings.alignment}
                onValueChange={(value: 'left' | 'center' | 'right') =>
                  onSettingsChange({ ...settings, alignment: value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left Aligned</SelectItem>
                  <SelectItem value="center">Center Aligned</SelectItem>
                  <SelectItem value="right">Right Aligned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-4 shadow-xs">
            <div>
              <Label className="text-sm font-medium cursor-pointer">Background Box</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Add semi-transparent backdrop for busy video footage.</p>
            </div>
            <Switch
              checked={settings.background}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, background: checked })}
            />
          </div>
        </div>

        {/* Live Preview Stage */}
        <div className="space-y-2 pt-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Live Style Preview
          </Label>
          <div className="relative flex min-h-[200px] items-end justify-center rounded-xl bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 p-6 shadow-inner overflow-hidden border border-border/40">
            {/* Grid overlay for video stage simulation */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div
              className={cn(
                'relative z-10 max-w-full rounded-lg px-4 py-2 font-semibold leading-tight transition-all duration-150',
                settings.background && 'bg-black/65 backdrop-blur-sm shadow-md'
              )}
              style={{
                ...subtitlePreviewStyle,
                textAlign: settings.alignment || 'center',
                alignSelf: settings.position === 'top' ? 'flex-start' : 'flex-end',
              }}
            >
              Professional subtitles in context
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
