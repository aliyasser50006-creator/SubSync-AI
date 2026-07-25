'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { EditableCue } from '@/lib/types/database';
import { VALIDATION } from './validation-constants';

export type ValidationSeverity = 'error' | 'warning';

export type ValidationRuleId =
  | 'INVALID_TIMESTAMP'
  | 'OVERLAPPING_CUES'
  | 'EMPTY_TEXT'
  | 'MALFORMED_TIMESTAMP'
  | 'HIGH_CPS'
  | 'TEXT_TOO_LONG'
  | 'TOO_MANY_LINES'
  | 'LINE_TOO_LONG'
  | 'DURATION_TOO_SHORT'
  | 'DURATION_TOO_LONG'
  | 'GAP_TOO_SMALL'
  | 'LARGE_SILENCE';

export interface ValidationIssue {
  id: string;
  ruleId: ValidationRuleId;
  severity: ValidationSeverity;
  cueId: string;
  cueIndex: number;
  message: string;
  detail?: string;
  autoFixAvailable: boolean;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  isValid: boolean;
  healthScore: number;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
}

function validateCues(cues: EditableCue[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (cues.length === 0) return issues;

  const sorted = [...cues].sort((a, b) => a.start - b.start);

  for (let i = 0; i < sorted.length; i++) {
    const cue = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : null;

    if (cue.start >= cue.end) {
      issues.push({
        id: `INVALID_TIMESTAMP-${cue.id}`,
        ruleId: 'INVALID_TIMESTAMP',
        severity: 'error',
        cueId: cue.id,
        cueIndex: cue.index,
        message: `Cue #${cue.index}: Start time ≥ End time`,
        detail: `${formatTimestamp(cue.start)} → ${formatTimestamp(cue.end)}`,
        autoFixAvailable: true,
      });
    }

    if (prev && cue.start < prev.end) {
      issues.push({
        id: `OVERLAPPING_CUES-${cue.id}`,
        ruleId: 'OVERLAPPING_CUES',
        severity: 'error',
        cueId: cue.id,
        cueIndex: cue.index,
        message: `Cue #${cue.index} overlaps with Cue #${prev.index}`,
        detail: `Starts at ${formatTimestamp(cue.start)}, previous ends at ${formatTimestamp(prev.end)}`,
        autoFixAvailable: true,
      });
    }

    if (!cue.text.trim()) {
      issues.push({
        id: `EMPTY_TEXT-${cue.id}`,
        ruleId: 'EMPTY_TEXT',
        severity: 'error',
        cueId: cue.id,
        cueIndex: cue.index,
        message: `Cue #${cue.index} contains no text`,
        autoFixAvailable: true,
      });
    }

    const duration = cue.end - cue.start;
    const charCount = cue.text.length;
    const lines = cue.text.split('\n');
    const cps = duration > 0 ? charCount / duration : 0;

    if (cps > VALIDATION.MAX_CPS && duration > 0 && cue.text.trim()) {
      issues.push({
        id: `HIGH_CPS-${cue.id}`,
        ruleId: 'HIGH_CPS',
        severity: 'warning',
        cueId: cue.id,
        cueIndex: cue.index,
        message: `Cue #${cue.index}: High reading speed`,
        detail: `${cps.toFixed(1)} CPS (limit: ${VALIDATION.MAX_CPS})`,
        autoFixAvailable: false,
      });
    }

    if (charCount > VALIDATION.MAX_TOTAL_CHARS && cue.text.trim()) {
      issues.push({
        id: `TEXT_TOO_LONG-${cue.id}`,
        ruleId: 'TEXT_TOO_LONG',
        severity: 'warning',
        cueId: cue.id,
        cueIndex: cue.index,
        message: `Cue #${cue.index}: Text exceeds ${VALIDATION.MAX_TOTAL_CHARS} characters`,
        detail: `${charCount} characters`,
        autoFixAvailable: false,
      });
    }

    if (lines.length > VALIDATION.MAX_LINES_PER_CUE) {
      issues.push({
        id: `TOO_MANY_LINES-${cue.id}`,
        ruleId: 'TOO_MANY_LINES',
        severity: 'warning',
        cueId: cue.id,
        cueIndex: cue.index,
        message: `Cue #${cue.index}: More than ${VALIDATION.MAX_LINES_PER_CUE} lines`,
        detail: `${lines.length} lines`,
        autoFixAvailable: false,
      });
    }

    for (const line of lines) {
      if (line.length > VALIDATION.MAX_CHARS_PER_LINE) {
        issues.push({
          id: `LINE_TOO_LONG-${cue.id}`,
          ruleId: 'LINE_TOO_LONG',
          severity: 'warning',
          cueId: cue.id,
          cueIndex: cue.index,
          message: `Cue #${cue.index}: Line exceeds ${VALIDATION.MAX_CHARS_PER_LINE} characters`,
          detail: `"${line.slice(0, 30)}${line.length > 30 ? '...' : ''}" (${line.length} chars)`,
          autoFixAvailable: false,
        });
        break;
      }
    }

    if (duration > 0 && duration < VALIDATION.MIN_DURATION_SECONDS) {
      issues.push({
        id: `DURATION_TOO_SHORT-${cue.id}`,
        ruleId: 'DURATION_TOO_SHORT',
        severity: 'warning',
        cueId: cue.id,
        cueIndex: cue.index,
        message: `Cue #${cue.index}: Duration too short`,
        detail: `${(duration * 1000).toFixed(0)}ms (min: ${VALIDATION.MIN_DURATION_SECONDS * 1000}ms)`,
        autoFixAvailable: true,
      });
    }

    if (duration > VALIDATION.MAX_DURATION_SECONDS) {
      issues.push({
        id: `DURATION_TOO_LONG-${cue.id}`,
        ruleId: 'DURATION_TOO_LONG',
        severity: 'warning',
        cueId: cue.id,
        cueIndex: cue.index,
        message: `Cue #${cue.index}: Duration too long`,
        detail: `${duration.toFixed(1)}s (max: ${VALIDATION.MAX_DURATION_SECONDS}s)`,
        autoFixAvailable: false,
      });
    }

    if (prev && cue.start >= prev.end) {
      const gapMs = (cue.start - prev.end) * 1000;
      if (gapMs > 0 && gapMs < VALIDATION.MIN_GAP_MS) {
        issues.push({
          id: `GAP_TOO_SMALL-${cue.id}`,
          ruleId: 'GAP_TOO_SMALL',
          severity: 'warning',
          cueId: cue.id,
          cueIndex: cue.index,
          message: `Cue #${cue.index}: Gap to previous cue too small`,
          detail: `${gapMs.toFixed(0)}ms (min: ${VALIDATION.MIN_GAP_MS}ms)`,
          autoFixAvailable: true,
        });
      }
    }

    if (prev && cue.start >= prev.end) {
      const gapSec = cue.start - prev.end;
      if (gapSec > VALIDATION.MAX_SILENCE_SECONDS) {
        issues.push({
          id: `LARGE_SILENCE-${cue.id}`,
          ruleId: 'LARGE_SILENCE',
          severity: 'warning',
          cueId: cue.id,
          cueIndex: cue.index,
          message: `Cue #${cue.index}: Large gap before this cue`,
          detail: `${gapSec.toFixed(1)}s of silence (max: ${VALIDATION.MAX_SILENCE_SECONDS}s)`,
          autoFixAvailable: false,
        });
      }
    }
  }

  return issues;
}

function calculateHealthScore(issues: ValidationIssue[], totalCues: number): number {
  if (totalCues === 0) return 100;

  let penalty = 0;
  for (const issue of issues) {
    if (issue.severity === 'error') {
      penalty += 15;
    } else {
      penalty += 3;
    }
  }

  const maxPenalty = totalCues * 15;
  const normalizedPenalty = Math.min(penalty, maxPenalty);
  const score = Math.max(0, Math.round(100 - (normalizedPenalty / Math.max(maxPenalty, 1)) * 100));
  return score;
}

export interface UseSubtitleValidationReturn {
  result: ValidationResult;
  issuesForCue: (cueId: string) => ValidationIssue[];
  applyAutoFix: (issueId: string) => void;
  applyAllAutoFixes: (severity?: ValidationSeverity) => void;
  triggerValidation: () => void;
}

interface EditorActions {
  updateCueTime: (id: string, field: 'start' | 'end', seconds: number) => void;
  deleteCue: (id: string) => void;
}

export function useSubtitleValidation(
  cues: EditableCue[],
  editorActions: EditorActions
): UseSubtitleValidationReturn {
  const [result, setResult] = useState<ValidationResult>({
    issues: [],
    errorCount: 0,
    warningCount: 0,
    isValid: true,
    healthScore: 100,
  });

  const cuesRef = useRef(cues);
  cuesRef.current = cues;

  const triggerValidation = useCallback(() => {
    const issues = validateCues(cuesRef.current);
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const healthScore = calculateHealthScore(issues, cuesRef.current.length);

    setResult({
      issues,
      errorCount,
      warningCount,
      isValid: errorCount === 0,
      healthScore,
    });
  }, []);

  useEffect(() => {
    triggerValidation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const issuesByCue = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    for (const issue of result.issues) {
      const existing = map.get(issue.cueId);
      if (existing) {
        existing.push(issue);
      } else {
        map.set(issue.cueId, [issue]);
      }
    }
    return map;
  }, [result.issues]);

  const issuesForCue = useCallback(
    (cueId: string) => issuesByCue.get(cueId) || [],
    [issuesByCue]
  );

  const applyAutoFix = useCallback(
    (issueId: string) => {
      const issue = result.issues.find((i) => i.id === issueId);
      if (!issue || !issue.autoFixAvailable) return;

      const currentCues = cuesRef.current;
      const sorted = [...currentCues].sort((a, b) => a.start - b.start);
      const cue = sorted.find((c) => c.id === issue.cueId);
      if (!cue) return;

      const cueIdx = sorted.indexOf(cue);
      const prev = cueIdx > 0 ? sorted[cueIdx - 1] : null;

      switch (issue.ruleId) {
        case 'INVALID_TIMESTAMP':
          editorActions.updateCueTime(cue.id, 'end', cue.start + 1.0);
          break;
        case 'OVERLAPPING_CUES':
          if (prev) {
            editorActions.updateCueTime(cue.id, 'start', prev.end + 0.08);
          }
          break;
        case 'EMPTY_TEXT':
          editorActions.deleteCue(cue.id);
          break;
        case 'DURATION_TOO_SHORT':
          editorActions.updateCueTime(cue.id, 'end', cue.start + 0.5);
          break;
        case 'GAP_TOO_SMALL':
          if (prev) {
            editorActions.updateCueTime(cue.id, 'start', prev.end + 0.08);
          }
          break;
      }
    },
    [result.issues, editorActions]
  );

  const applyAllAutoFixes = useCallback(
    (severity?: ValidationSeverity) => {
      const fixable = result.issues.filter(
        (i) => i.autoFixAvailable && (!severity || i.severity === severity)
      );
      for (const issue of fixable) {
        applyAutoFix(issue.id);
      }
    },
    [result.issues, applyAutoFix]
  );

  return { result, issuesForCue, applyAutoFix, applyAllAutoFixes, triggerValidation };
}

export function computeQuickHealth(subtitleContent: string): {
  errorCount: number;
  warningCount: number;
  healthScore: number;
} {
  const { parseSubtitleContent } = require('@/lib/utils/subtitle-converter');
  const parsedCues = parseSubtitleContent(subtitleContent);
  const cues: EditableCue[] = parsedCues.map(
    (c: { id: number; start: number; end: number; text: string }, i: number) => ({
      id: `temp-${i}`,
      index: i + 1,
      start: c.start,
      end: c.end,
      text: c.text,
    })
  );

  const issues = validateCues(cues);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const healthScore = calculateHealthScore(issues, cues.length);

  return { errorCount, warningCount, healthScore };
}
