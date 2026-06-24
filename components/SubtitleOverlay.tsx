'use client';

import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { SubtitleCue } from '@/hooks/use-subtitle-parser';
import type { SubtitleSettings } from '@/lib/types/database';

interface SubtitleOverlayProps {
  cue: SubtitleCue;
  settings: SubtitleSettings;
  visible: boolean;
}

const SubtitleOverlay = memo(function SubtitleOverlay({
  cue,
  settings,
  visible,
}: SubtitleOverlayProps) {
  if (!visible) return null;

  const fontSize = settings.fontSize || 28;
  const fontColor = settings.fontColor || '#FFFFFF';
  const outlineColor = settings.outlineColor || '#000000';
  const outlineWidth = settings.outlineWidth ?? 2;
  const position = settings.position || 'bottom';
  const alignment = settings.alignment || 'center';
  const showBackground = settings.background ?? false;

  const textShadow = outlineWidth > 0
    ? `0px 0px 4px rgba(0, 0, 0, 0.9),
      ${outlineWidth}px ${outlineWidth}px 0 ${outlineColor},
      -${outlineWidth}px ${outlineWidth}px 0 ${outlineColor},
      ${outlineWidth}px -${outlineWidth}px 0 ${outlineColor},
      -${outlineWidth}px -${outlineWidth}px 0 ${outlineColor},
      0 ${outlineWidth}px 0 ${outlineColor},
      0 -${outlineWidth}px 0 ${outlineColor},
      ${outlineWidth}px 0 0 ${outlineColor},
      -${outlineWidth}px 0 0 ${outlineColor}
    `
    : '0px 0px 4px rgba(0, 0, 0, 0.9)';

  const containerStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    display: 'flex',
    pointerEvents: 'none',
    padding: '0 5%',
    justifyContent:
      alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
    ...(position === 'bottom' ? { bottom: '70px' } : { top: '20px' }),
  };

  const textStyle: CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: 1.3,
    color: fontColor,
    textShadow,
    textAlign: alignment as CSSProperties['textAlign'],
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.5px',
    whiteSpace: 'pre-wrap',
    maxWidth: '90%',
    ...(!showBackground
      ? {
          background: 'none',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          border: 'none',
        }
      : {}),
    ...(showBackground
      ? {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '6px 16px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)',
        }
      : {}),
  };

  return (
    <div style={containerStyle} className="subtitle-overlay-container">
      <span style={textStyle} className="subtitle-overlay-text">
        {cue.text}
      </span>
    </div>
  );
});

export default SubtitleOverlay;
