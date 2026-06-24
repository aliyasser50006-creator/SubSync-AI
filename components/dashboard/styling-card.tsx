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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Subtitle Styling
        </CardTitle>
        <CardDescription>Set readable caption styles before previewing the video.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Font Size</Label>
              <span className="text-sm text-muted-foreground">{settings.fontSize}px</span>
            </div>
            <Slider
              value={[settings.fontSize || 28]}
              onValueChange={([value]) => onSettingsChange({ ...settings, fontSize: value })}
              min={16}
              max={48}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Color</Label>
              <Input
                type="color"
                value={settings.fontColor}
                onChange={(e) => onSettingsChange({ ...settings, fontColor: e.target.value })}
                className="h-11 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Outline Color</Label>
              <Input
                type="color"
                value={settings.outlineColor}
                onChange={(e) => onSettingsChange({ ...settings, outlineColor: e.target.value })}
                className="h-11 p-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Outline Width</Label>
              <span className="text-sm text-muted-foreground">{settings.outlineWidth}px</span>
            </div>
            <Slider
              value={[settings.outlineWidth || 0]}
              onValueChange={([value]) => onSettingsChange({ ...settings, outlineWidth: value })}
              min={0}
              max={5}
              step={1}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={settings.position}
                onValueChange={(value: 'top' | 'bottom') => onSettingsChange({ ...settings, position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={settings.alignment}
                onValueChange={(value: 'left' | 'center' | 'right') =>
                  onSettingsChange({ ...settings, alignment: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/45 p-4">
            <div>
              <Label>Background Box</Label>
              <p className="mt-1 text-xs text-muted-foreground">Improve contrast for busy footage.</p>
            </div>
            <Switch
              checked={settings.background}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, background: checked })}
            />
          </div>
        </div>

        <div className="flex min-h-[220px] items-end justify-center rounded-lg bg-slate-950 p-5">
          <div
            className={cn(
              'max-w-full rounded px-3 py-1 text-center font-semibold leading-tight',
              settings.background && 'bg-black/55'
            )}
            style={subtitlePreviewStyle}
          >
            Subtitles preview in context
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
