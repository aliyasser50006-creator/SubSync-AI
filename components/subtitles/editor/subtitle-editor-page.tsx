'use client';

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getSubtitleById } from '@/lib/actions/subtitles';
import { getJobById } from '@/lib/actions/jobs';
import { parseSubtitleContent } from '@/lib/utils/subtitle-converter';
import { Subtitle, EditableCue, Job } from '@/lib/types/database';
import { useEditorState } from './use-editor-state';
import { useAutoSave, SaveStatus } from './use-auto-save';
import { useSubtitleValidation, ValidationIssue } from './use-subtitle-validation';
import { getHealthRating } from './validation-constants';
import {
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  Plus,
  Search,
  GripVertical,
  Trash2,
  Copy,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Merge,
  Scissors,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Wrench,
  FileText,
  RefreshCw,
  Clock,
  Video,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { duplicateSubtitle, deleteSubtitle } from '@/lib/actions/subtitles';
import { createClient } from '@/lib/supabase/client';

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });

interface SubtitleEditorPageProps {
  subtitleId: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function parseTime(str: string): number | null {
  const cleaned = str.replace(',', '.').trim();
  const parts = cleaned.split(':');
  if (parts.length !== 3) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parseFloat(parts[2]);
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
  if (h < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  switch (status) {
    case 'saved':
      return (
        <span className="save-indicator save-indicator-saved inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Saved
        </span>
      );
    case 'saving':
      return (
        <span className="save-indicator save-indicator-saving inline-flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" /> Saving...
        </span>
      );
    case 'unsaved':
      return (
        <span className="save-indicator save-indicator-unsaved inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> Unsaved
        </span>
      );
    case 'error':
      return (
        <span className="save-indicator save-indicator-error inline-flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Error
        </span>
      );
  }
}

const MemoizedCueItem = memo(({
  cue,
  arrayIndex,
  nextCueId,
  issues,
  isSelected,
  focusedCueId,
  isHighlight,
  isDragTarget,
  handleBlur,
  updateCueTime,
  updateCueText,
  toggleCueSelection,
  splitCue,
  mergeCues,
  duplicateCue,
  reorderCue,
  deleteCue,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setDragOverIndex,
  setShowValidation,
}: any) => {
  const hasError = issues.some((i: any) => i.severity === 'error');
  const hasWarning = !hasError && issues.some((i: any) => i.severity === 'warning');

  return (
    <div
      id={`cue-block-${cue.id}`}
      className={cn(
        'relative rounded-md p-2.5 my-1 transition-all',
        'border border-transparent',
        hasError && 'cue-block-error',
        hasWarning && 'cue-block-warning',
        isSelected && 'cue-block-selected',
        focusedCueId === cue.id && 'ring-1 ring-primary/50',
        isHighlight && 'bg-primary/5',
        isDragTarget && 'border-primary border-dashed',
        'content-visibility-auto'
      )}
      style={{ containIntrinsicSize: '0 120px' }}
      draggable
      onDragStart={(e) => handleDragStart(e, arrayIndex)}
      onDragOver={(e) => handleDragOver(e, arrayIndex)}
      onDrop={(e) => handleDrop(e, arrayIndex)}
      onDragLeave={() => setDragOverIndex(null)}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <GripVertical className="cue-drag-handle h-3.5 w-3.5 shrink-0" />
        <span className="text-[10px] font-bold text-muted-foreground w-6">#{cue.index}</span>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleCueSelection(cue.id)}
          className="h-3.5 w-3.5"
        />
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => splitCue(cue.id, Math.floor(cue.text.length / 2))}>
                <Scissors className="mr-2 h-3.5 w-3.5" />
                Split
              </DropdownMenuItem>
              {nextCueId && (
                <DropdownMenuItem onClick={() => mergeCues(cue.id, nextCueId)}>
                  <Merge className="mr-2 h-3.5 w-3.5" />
                  Merge with next
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => duplicateCue(cue.id)}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => reorderCue(cue.id, 'up')}>
                <ChevronUp className="mr-2 h-3.5 w-3.5" />
                Move up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => reorderCue(cue.id, 'down')}>
                <ChevronDown className="mr-2 h-3.5 w-3.5" />
                Move down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => deleteCue(cue.id)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          className="time-input rounded border border-border/60 bg-background/50 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          value={formatTime(cue.start)}
          onChange={(e) => {
            const t = parseTime(e.target.value);
            if (t !== null) updateCueTime(cue.id, 'start', t);
          }}
          onBlur={handleBlur}
          aria-label={`Start time for cue ${cue.index}`}
        />
        <span className="text-[10px] text-muted-foreground">→</span>
        <input
          type="text"
          className="time-input rounded border border-border/60 bg-background/50 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          value={formatTime(cue.end)}
          onChange={(e) => {
            const t = parseTime(e.target.value);
            if (t !== null) updateCueTime(cue.id, 'end', t);
          }}
          onBlur={handleBlur}
          aria-label={`End time for cue ${cue.index}`}
        />
      </div>

      <Textarea
        value={cue.text}
        onChange={(e) => updateCueText(cue.id, e.target.value)}
        onBlur={handleBlur}
        className="min-h-[44px] resize-none text-sm leading-relaxed"
        rows={Math.max(1, cue.text.split('\n').length)}
        aria-label={`Text for cue ${cue.index}`}
      />

      {issues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {issues.slice(0, 3).map((issue: any) => (
            <span
              key={issue.id}
              className={cn(
                'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer',
                issue.severity === 'error'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-warning/10 text-warning'
              )}
              onClick={() => {
                setShowValidation(true);
              }}
            >
              {issue.severity === 'error' ? (
                <XCircle className="h-2.5 w-2.5" />
              ) : (
                <AlertTriangle className="h-2.5 w-2.5" />
              )}
              {issue.ruleId.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: any) => c.toUpperCase())}
            </span>
          ))}
          {issues.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{issues.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export function SubtitleEditorPage({ subtitleId }: SubtitleEditorPageProps) {
  const router = useRouter();
  const [subtitle, setSubtitle] = useState<Subtitle | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [focusedCueId, setFocusedCueId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cueListRef = useRef<HTMLDivElement>(null);
  const subtitleBlobUrlRef = useRef<string | null>(null);
  const [subtitlePreviewUrl, setSubtitlePreviewUrl] = useState<string | null>(null);


  const editor = useEditorState();

  const autoSave = useAutoSave({
    subtitleId: subtitle?.id || subtitleId,
    isDirty: editor.isDirty,
    serialize: () => editor.serialize(subtitle?.format || 'srt'),
    resetDirty: editor.resetDirty,
  });

  const validation = useSubtitleValidation(editor.cues, {
    updateCueTime: editor.updateCueTime,
    deleteCue: editor.deleteCue,
  });

  const healthRating = getHealthRating(validation.result.healthScore);

  // Load subtitle data
  useEffect(() => {
    const load = async () => {
      const { data, error } = await getSubtitleById(subtitleId);
      if (error || !data) {
        toast.error('Subtitle not found');
        router.push('/library/subtitles');
        return;
      }
      setSubtitle(data);

      const parsed = parseSubtitleContent(data.subtitle_content);
      const editableCues: EditableCue[] = parsed.map((cue, i) => ({
        id: crypto.randomUUID(),
        index: i + 1,
        start: cue.start,
        end: cue.end,
        text: cue.text,
      }));
      editor.setCues(editableCues);

      // Find job linked to this subtitle path
      if (data.path) {
        const supabase = createClient();
        const { data: jobData } = await supabase
          .from('jobs')
          .select('*')
          .eq('subtitle_file', data.path)
          .single();
        if (jobData) {
          let videoUrl = jobData.video_url;
          if (videoUrl) {
            // Try to extract path from a potentially expired signed URL
            let videoPath = videoUrl;
            if (videoUrl.includes('/object/sign/videos/')) {
              videoPath = videoUrl.split('/object/sign/videos/')[1].split('?')[0];
            } else if (videoUrl.includes('/object/public/videos/')) {
              videoPath = videoUrl.split('/object/public/videos/')[1].split('?')[0];
            }
            
            // If it's a path or we extracted a path, create a fresh signed URL
            if (videoPath && !videoPath.startsWith('http')) {
              const {
                data: { user: currentUser },
              } = await supabase.auth.getUser();
              const { data: signedData } = await supabase.storage.from('videos').createSignedUrl(videoPath, 3600);
              if (signedData?.signedUrl) {
                videoUrl = signedData.signedUrl;
              }
            }
          }
          setJob({ ...jobData, video_url: videoUrl } as Job);
        }
      }

      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtitleId]);

  const autoSaveRef = useRef(autoSave);
  autoSaveRef.current = autoSave;

  const validationRef = useRef(validation);
  validationRef.current = validation;

  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Update live subtitle preview blob manually
  const updatePreviewBlob = useCallback(() => {
    if (editorRef.current.cues.length === 0) {
      setSubtitlePreviewUrl(null);
      return;
    }

    const vttContent = editorRef.current.serialize('vtt');
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);

    if (subtitleBlobUrlRef.current) {
      URL.revokeObjectURL(subtitleBlobUrlRef.current);
    }
    subtitleBlobUrlRef.current = url;
    setSubtitlePreviewUrl(url);
  }, []);

  const handleBlur = useCallback(() => {
    autoSaveRef.current.triggerBlurSave();
    validationRef.current.triggerValidation();
    updatePreviewBlob();
  }, [updatePreviewBlob]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (subtitleBlobUrlRef.current) {
        URL.revokeObjectURL(subtitleBlobUrlRef.current);
        subtitleBlobUrlRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            autoSaveRef.current.manualSave();
            break;
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              editorRef.current.redo();
            } else {
              e.preventDefault();
              editorRef.current.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            editorRef.current.redo();
            break;
          case 'f':
            e.preventDefault();
            setShowSearch((prev) => !prev);
            break;
          case 'a':
            if (document.activeElement?.closest('[data-cue-list]')) {
              e.preventDefault();
              editorRef.current.selectAllCues();
            }
            break;
        }
      }
      if (e.key === 'Escape') {
        editorRef.current.clearSelection();
        setShowSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = useCallback(
    (format: 'srt' | 'vtt') => {
      const content = editor.serialize(format);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${subtitle?.title || 'subtitle'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [editor, subtitle]
  );

  const handleDuplicate = useCallback(async () => {
    setDuplicating(true);
    const { data, error } = await duplicateSubtitle(subtitleId);
    if (error) {
      toast.error('Failed to duplicate');
    } else if (data) {
      toast.success('Duplicated — opening copy');
      router.push(`/library/subtitles/${data.id}`);
    }
    setDuplicating(false);
  }, [subtitleId, router]);

  const handleDeleteSubtitle = useCallback(async () => {
    setDeleting(true);
    const { error } = await deleteSubtitle(subtitleId);
    if (error) {
      toast.error('Failed to delete');
      setDeleting(false);
    } else {
      toast.success('Subtitle deleted');
      router.push('/library/subtitles');
    }
  }, [subtitleId, router]);

  const scrollToCue = useCallback((cueId: string) => {
    const el = document.getElementById(`cue-block-${cueId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('cue-block-highlight-pulse');
      setTimeout(() => el.classList.remove('cue-block-highlight-pulse'), 1500);
    }
    setFocusedCueId(cueId);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return editor.cues.filter((c) => c.text.toLowerCase().includes(q));
  }, [searchQuery, editor.cues]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        editor.moveCue(fromIndex, toIndex);
      }
      setDragOverIndex(null);
    },
    [editor]
  );

  // Normalize timestamps tool
  const normalizeTimestamps = useCallback(() => {
    const sorted = [...editor.cues].sort((a, b) => a.start - b.start);
    let changed = false;
    for (let i = 0; i < sorted.length; i++) {
      const cue = sorted[i];
      const roundedStart = Math.round(cue.start * 1000) / 1000;
      const roundedEnd = Math.round(cue.end * 1000) / 1000;
      if (roundedStart !== cue.start || roundedEnd !== cue.end) {
        editor.updateCueTime(cue.id, 'start', roundedStart);
        editor.updateCueTime(cue.id, 'end', roundedEnd);
        changed = true;
      }
    }
    toast.success(changed ? 'Timestamps normalized' : 'Timestamps already normalized');
  }, [editor]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-4">
            <Skeleton className="h-full rounded-lg" />
          </div>
          <div className="w-[420px] border-l border-border/60 p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:h-screen">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border/60 bg-card/80 px-3 py-2 backdrop-blur-sm flex-wrap">
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link href="/library/subtitles">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Subtitles</span>
          </Link>
        </Button>

        <div className="h-5 w-px bg-border/60 hidden sm:block" />

        <div
          className="truncate text-sm font-semibold max-w-[200px]"
          title={job?.title || subtitle?.title || 'Untitled'}
        >
          {job?.title || subtitle?.title || 'Untitled'}
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
          <SaveIndicator status={autoSave.saveStatus} />

          {/* Health score */}
          <span
            className={cn(
              'validation-indicator',
              healthRating.color === 'success' && 'validation-valid',
              healthRating.color === 'warning' && 'validation-warnings',
              healthRating.color === 'destructive' && 'validation-errors',
              healthRating.color === 'primary' && 'bg-primary/10 text-primary'
            )}
            title={`Health: ${validation.result.healthScore}/100`}
          >
            {validation.result.healthScore}/100
          </span>

          {/* Validation indicator */}
          <button
            className={cn(
              'validation-indicator',
              validation.result.errorCount > 0
                ? 'validation-errors'
                : validation.result.warningCount > 0
                ? 'validation-warnings'
                : 'validation-valid'
            )}
            onClick={() => setShowValidation((prev) => !prev)}
          >
            {validation.result.errorCount > 0
              ? `❌ ${validation.result.errorCount}`
              : validation.result.warningCount > 0
              ? `⚠ ${validation.result.warningCount}`
              : '✓ Valid'}
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSearch((prev) => !prev)}
            title="Search (Ctrl+F)"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={editor.undo} disabled={!editor.canUndo} title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={editor.redo} disabled={!editor.canRedo} title="Redo (Ctrl+Y)">
            <Redo2 className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={() => autoSave.manualSave()} className="hidden sm:flex">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload('srt')}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Download SRT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('vtt')}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Download VTT
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate} disabled={duplicating}>
                {duplicating ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Copy className="mr-2 h-3.5 w-3.5" />
                )}
                {duplicating ? 'Duplicating...' : 'Duplicate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTools((prev) => !prev)}>
                <Wrench className="mr-2 h-3.5 w-3.5" />
                Tools
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleDeleteSubtitle} disabled={deleting}>
                {deleting ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                )}
                {deleting ? 'Deleting...' : 'Delete Subtitle'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 border-b border-border/40 bg-card/60 px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search subtitle text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 max-w-sm"
            autoFocus
          />
          {searchResults && (
            <span className="text-xs text-muted-foreground shrink-0">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
            Close
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left: Video Panel */}
        <div className="lg:flex-1 lg:min-w-0 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col">
          <div className="p-4 border-b border-border/40 bg-card/30">
            <h2 className="text-xl font-bold tracking-tight text-foreground line-clamp-1 mb-3" title={job?.title || subtitle?.title || 'Untitled Video'}>
              {job?.title || subtitle?.title || 'Untitled Video'}
            </h2>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-x-8 gap-y-2 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</span>
                <span className="font-medium capitalize">{job ? job.status : 'Standalone Subtitle'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Format</span>
                <span className="font-medium uppercase">{subtitle?.format || 'SRT'}</span>
              </div>
              <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Uploaded</span>
                <span className="font-medium">
                  {(() => {
                    const date = job ? new Date(job.created_at) : (subtitle ? new Date(subtitle.created_at) : new Date());
                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                  })()}
                </span>
              </div>
            </div>
          </div>
          <div className="p-3 lg:p-4 flex-1 flex flex-col min-h-0">
            {job?.video_url ? (
              <div className="flex-1 min-h-[200px] lg:min-h-0">
                <VideoPlayer
                  src={job.video_url}
                  subtitleUrl={subtitlePreviewUrl}
                  subtitleSettings={job.subtitle_settings}
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 min-h-[200px]">
                <Video className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No video linked to this subtitle</p>
              </div>
            )}

            {/* Timeline */}
            <div className="mt-3 subtitle-timeline p-2 hidden lg:block">
              <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ minHeight: '36px' }}>
                {editor.cues.length === 0 ? (
                  <span className="text-xs text-muted-foreground px-2">No cues</span>
                ) : (
                  (() => {
                    const maxEnd = Math.max(...editor.cues.map((c) => c.end), 1);
                    return editor.cues.map((cue) => {
                      const leftPct = (cue.start / maxEnd) * 100;
                      const widthPct = Math.max(((cue.end - cue.start) / maxEnd) * 100, 0.5);
                      const issues = validation.issuesForCue(cue.id);
                      const hasError = issues.some((i) => i.severity === 'error');
                      const hasWarning = issues.some((i) => i.severity === 'warning');
                      return (
                        <div
                          key={cue.id}
                          className={cn(
                            'absolute h-6 rounded-sm cursor-pointer transition-colors text-[8px] flex items-center justify-center overflow-hidden',
                            hasError
                              ? 'bg-destructive/30 hover:bg-destructive/50'
                              : hasWarning
                              ? 'bg-warning/30 hover:bg-warning/50'
                              : 'bg-primary/25 hover:bg-primary/40'
                          )}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          onClick={() => scrollToCue(cue.id)}
                          title={`Cue #${cue.index}: ${formatTime(cue.start)} → ${formatTime(cue.end)}`}
                        >
                          <span className="truncate px-0.5">{cue.index}</span>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

            {/* Collapsible panels below video */}
            <div className="mt-3 space-y-2 hidden lg:block">
              {/* Subtitle Tools */}
              <Collapsible open={showTools} onOpenChange={setShowTools}>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-md border border-border/40 bg-card/50 px-3 py-2 text-sm font-medium hover:bg-accent/30 transition-colors">
                    <span className="flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                      Subtitle Tools
                    </span>
                    {showTools ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1 rounded-md border border-border/40 bg-card/30 p-3 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => setShowValidation(true)}
                    >
                      <Shield className="mr-1.5 h-3.5 w-3.5" />
                      Validate File
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => {
                        toast.success(`Line count: ${editor.cues.length}`);
                      }}
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      Recalculate Lines
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={normalizeTimestamps}
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Normalize Times
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => handleDownload('srt')}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Export SRT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs col-span-2"
                      onClick={() => handleDownload('vtt')}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Export VTT
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>

        {/* Right: Cue List + Validation */}
        <div className="flex-1 lg:flex-none lg:w-[460px] xl:w-[520px] flex flex-col overflow-hidden">
          {/* Validation Panel */}
          {showValidation && (
            <div className="border-b border-border/40 bg-card/50 max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 flex items-center justify-between bg-card/90 backdrop-blur-sm px-4 py-2.5 border-b border-border/30 z-10">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Validation</span>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    healthRating.color === 'success' && 'bg-success/10 text-success',
                    healthRating.color === 'primary' && 'bg-primary/10 text-primary',
                    healthRating.color === 'warning' && 'bg-warning/10 text-warning',
                    healthRating.color === 'destructive' && 'bg-destructive/10 text-destructive',
                  )}>
                    {validation.result.healthScore}/100 {healthRating.label}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowValidation(false)}>
                  Close
                </Button>
              </div>

              <div className="p-3 space-y-2">
                {validation.result.issues.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                    <p className="mt-2 text-sm font-medium text-success">No issues found</p>
                    <p className="text-xs text-muted-foreground">Your subtitles look great!</p>
                  </div>
                ) : (
                  <>
                    {/* Errors */}
                    {validation.result.errorCount > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
                            Errors ({validation.result.errorCount})
                          </span>
                          {validation.result.issues.filter((i) => i.severity === 'error' && i.autoFixAvailable).length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] text-destructive border-destructive/30"
                              onClick={() => validation.applyAllAutoFixes('error')}
                            >
                              Fix All Errors
                            </Button>
                          )}
                        </div>
                        {validation.result.issues
                          .filter((i) => i.severity === 'error')
                          .map((issue) => (
                            <div
                              key={issue.id}
                              className="validation-issue-row"
                              onClick={() => scrollToCue(issue.cueId)}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                  <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium">{issue.message}</p>
                                    {issue.detail && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{issue.detail}</p>
                                    )}
                                  </div>
                                </div>
                                {issue.autoFixAvailable && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      validation.applyAutoFix(issue.id);
                                    }}
                                  >
                                    Fix
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Warnings */}
                    {validation.result.warningCount > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-warning uppercase tracking-wider">
                            Warnings ({validation.result.warningCount})
                          </span>
                          {validation.result.issues.filter((i) => i.severity === 'warning' && i.autoFixAvailable).length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] text-warning border-warning/30"
                              onClick={() => validation.applyAllAutoFixes('warning')}
                            >
                              Fix All Warnings
                            </Button>
                          )}
                        </div>
                        {validation.result.issues
                          .filter((i) => i.severity === 'warning')
                          .map((issue) => (
                            <div
                              key={issue.id}
                              className="validation-issue-row"
                              onClick={() => scrollToCue(issue.cueId)}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium">{issue.message}</p>
                                    {issue.detail && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{issue.detail}</p>
                                    )}
                                  </div>
                                </div>
                                {issue.autoFixAvailable && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      validation.applyAutoFix(issue.id);
                                    }}
                                  >
                                    Fix
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Cue List */}
          <div
            ref={cueListRef}
            data-cue-list
            className="flex-1 overflow-y-auto"
          >
            {editor.cues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">No subtitle cues</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click &quot;Add Cue&quot; below to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/30 px-2 py-1">
                {editor.cues.map((cue, arrayIndex) => {
                  const issues = validation.issuesForCue(cue.id);
                  const isSelected = editor.selectedCueIds.has(cue.id);
                  const isHighlight = searchResults?.some((r) => r.id === cue.id);
                  const isDragTarget = dragOverIndex === arrayIndex;
                  const nextCueId = arrayIndex < editor.cues.length - 1 ? editor.cues[arrayIndex + 1].id : null;

                  return (
                    <MemoizedCueItem
                      key={cue.id}
                      cue={cue}
                      arrayIndex={arrayIndex}
                      nextCueId={nextCueId}
                      issues={issues}
                      isSelected={isSelected}
                      focusedCueId={focusedCueId}
                      isHighlight={isHighlight}
                      isDragTarget={isDragTarget}
                      handleBlur={handleBlur}
                      updateCueTime={editor.updateCueTime}
                      updateCueText={editor.updateCueText}
                      toggleCueSelection={editor.toggleCueSelection}
                      splitCue={editor.splitCue}
                      mergeCues={editor.mergeCues}
                      duplicateCue={editor.duplicateCue}
                      reorderCue={editor.reorderCue}
                      deleteCue={editor.deleteCue}
                      handleDragStart={handleDragStart}
                      handleDragOver={handleDragOver}
                      handleDrop={handleDrop}
                      setDragOverIndex={setDragOverIndex}
                      setShowValidation={setShowValidation}
                    />
                  );
                })}
              </div>
            )}

            {/* Add Cue button */}
            <div className="sticky bottom-0 border-t border-border/30 bg-background/90 backdrop-blur-sm p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => editor.addCue()}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Cue
              </Button>
              {editor.selectedCueIds.size > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {editor.selectedCueIds.size} selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={editor.deleteSelectedCues}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
