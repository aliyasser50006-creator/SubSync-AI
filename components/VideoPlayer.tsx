'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Subtitles,
  Loader as Loader2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import SubtitleOverlay from '@/components/SubtitleOverlay';
import { useSubtitleParser, type SubtitleCue } from '@/hooks/use-subtitle-parser';
import { SubtitleSettings } from '@/lib/types/database';

interface VideoPlayerProps {
  src: string;
  posterUrl?: string | null;
  subtitleUrl?: string | null;
  subtitleSettings?: SubtitleSettings;
  subtitleDelaySeconds?: number;
  className?: string;
  playRequestId?: number;
}

type MediaEventShape = {
  playedSeconds?: number;
  currentTarget?: {
    currentTime?: number;
    duration?: number;
  };
  target?: {
    currentTime?: number;
    duration?: number;
  };
};

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2] as const;

// ── Double-tap-to-seek constants ────────────────────────────
const DOUBLE_TAP_DELAY = 300;       // ms between two taps to count as double-tap
const MOVE_TOLERANCE   = 10;        // px of finger travel before we treat it as a scroll/swipe
const DOUBLE_TAP_SEEK_SECONDS = 5;  // seconds to seek per double-tap
const LONG_PRESS_MS    = 500;       // ms hold duration that suppresses the tap gesture

type ReactPlayerComponent = React.ComponentType<any>;

function formatTime(seconds: number): string {
  if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function extractCurrentTime(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (!value || typeof value !== 'object') return null;
  const eventLike = value as MediaEventShape;

  if (typeof eventLike.playedSeconds === 'number' && Number.isFinite(eventLike.playedSeconds)) {
    return eventLike.playedSeconds;
  }

  const fromCurrentTarget = eventLike.currentTarget?.currentTime;
  if (typeof fromCurrentTarget === 'number' && Number.isFinite(fromCurrentTarget)) {
    return fromCurrentTarget;
  }

  const fromTarget = eventLike.target?.currentTime;
  if (typeof fromTarget === 'number' && Number.isFinite(fromTarget)) {
    return fromTarget;
  }

  return null;
}

function extractDuration(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (!value || typeof value !== 'object') return null;
  const eventLike = value as MediaEventShape;

  const fromCurrentTarget = eventLike.currentTarget?.duration;
  if (typeof fromCurrentTarget === 'number' && Number.isFinite(fromCurrentTarget)) {
    return fromCurrentTarget;
  }

  const fromTarget = eventLike.target?.duration;
  if (typeof fromTarget === 'number' && Number.isFinite(fromTarget)) {
    return fromTarget;
  }

  return null;
}

function findActiveCue(
  cues: SubtitleCue[],
  currentTime: number,
  previousIndex: number
): { cue: SubtitleCue | null; index: number } {
  if (!cues.length) return { cue: null, index: -1 };

  const previousCue = cues[previousIndex];
  if (previousCue && currentTime >= previousCue.start && currentTime < previousCue.end) {
    return { cue: previousCue, index: previousIndex };
  }

  const nextCue = cues[previousIndex + 1];
  if (nextCue && currentTime >= nextCue.start && currentTime < nextCue.end) {
    return { cue: nextCue, index: previousIndex + 1 };
  }

  let low = 0;
  let high = cues.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cue = cues[mid];

    if (currentTime < cue.start) {
      high = mid - 1;
    } else if (currentTime >= cue.end) {
      low = mid + 1;
    } else {
      return { cue, index: mid };
    }
  }

  return { cue: null, index: -1 };
}

export default function VideoPlayer({
  src,
  posterUrl = null,
  subtitleUrl = null,
  subtitleSettings = {},
  subtitleDelaySeconds = 0,
  className = '',
  playRequestId,
}: VideoPlayerProps) {
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressThumbRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);
  const cuesRef = useRef<SubtitleCue[]>([]);
  const activeCueIdRef = useRef<number | null>(null);
  const activeCueIndexRef = useRef(-1);
  const previousActiveCueIndexRef = useRef(-2);
  const subtitlesEnabledRef = useRef(true);
  const subtitleDelaySecondsRef = useRef(subtitleDelaySeconds);

  // ── Double-tap-to-seek gesture ────────────────────────────────────────────
  // lastTapRef: records when/where/which-side the most recent touchend landed.
  // After a confirmed double-tap we keep time=now so the NEXT tap within
  // DOUBLE_TAP_DELAY chains (YouTube-style consecutive seeking).
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' } | null>(null);
  // touchStartRef: set by onTouchStart so we can detect scrolls/swipes and long-presses.
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  // playingRef / showControlsRef: kept in sync so the single-tap timer reads fresh values
  // without closing over stale state (avoids stale-closure in useCallback).
  const playingRef = useRef(false);
  const showControlsRef = useRef(true);
  // singleTapTimerRef: fires togglePlay() after DOUBLE_TAP_DELAY if no second tap arrives.
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doubleTapFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // seekAccumulatorRef: counts consecutive same-side double-taps for the cumulative label.
  const seekAccumulatorRef = useRef(0);

  const [playerKey, setPlayerKey] = useState(0);
  const [ReactPlayer, setReactPlayer] = useState<ReactPlayerComponent | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [ready, setReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeCue, setActiveCue] = useState<SubtitleCue | null>(null);
  // doubleTapFeedback: id increments on every double-tap so React remounts the overlay
  // (changing `key`) and the CSS @keyframes animation restarts from frame 0.
  // label is merged in so we avoid a separate dtsLabel state.
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{
    side: 'left' | 'right';
    id: number;
    label: string;
  } | null>(null);

  const normalizedSrc = useMemo(() => (typeof src === 'string' ? src.trim() : ''), [src]);
  const hasSource = normalizedSrc.length > 0;

  const { cues, error: subtitleError, loading: subtitleLoading } = useSubtitleParser(subtitleUrl);

  useEffect(() => {
    let cancelled = false;

    import('react-player')
      .then((module) => {
        if (!cancelled) {
          setReactPlayer(() => (module.default || module) as ReactPlayerComponent);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVideoError('Unable to load the video player. Please refresh and try again.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  const updateActiveCue = useCallback((playbackTime: number) => {
    if (!subtitlesEnabledRef.current || cuesRef.current.length === 0) {
      if (activeCueIdRef.current !== null) {
        activeCueIdRef.current = null;
        activeCueIndexRef.current = -1;
        setActiveCue(null);
      }
      return;
    }

    const cueTime = Math.max(0, playbackTime - subtitleDelaySecondsRef.current);
    const { cue, index } = findActiveCue(cuesRef.current, cueTime, activeCueIndexRef.current);
    const nextCueId = cue?.id ?? null;

    if (activeCueIdRef.current !== nextCueId) {
      activeCueIdRef.current = nextCueId;
      activeCueIndexRef.current = index;
      setActiveCue(cue);
    } else {
      activeCueIndexRef.current = index;
    }

    if (previousActiveCueIndexRef.current !== activeCueIndexRef.current) {
      previousActiveCueIndexRef.current = activeCueIndexRef.current;
      window.dispatchEvent(new CustomEvent('subsync:activecue', { detail: { index: activeCueIndexRef.current } }));
    }
  }, []);

  const renderPlaybackSnapshot = useCallback((nextTime: number, nextDuration = durationRef.current) => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const progress = nextDuration > 0
        ? Math.min(100, Math.max(0, (nextTime / nextDuration) * 100))
        : 0;

      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${progress}%`;
      }

      if (progressThumbRef.current) {
        progressThumbRef.current.style.left = `${progress}%`;
      }

      if (timeDisplayRef.current) {
        timeDisplayRef.current.textContent = `${formatTime(nextTime)} / ${formatTime(nextDuration)}`;
      }

      animationFrameRef.current = null;
    });
  }, []);

  const setDurationSafely = useCallback((nextDuration: number) => {
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) return;

    durationRef.current = nextDuration;
    renderPlaybackSnapshot(currentTimeRef.current, nextDuration);
    setDuration((prev) => (Math.abs(prev - nextDuration) > 0.05 ? nextDuration : prev));
  }, [renderPlaybackSnapshot]);

  const setCurrentTimeSafely = useCallback((nextTime: number, force = false) => {
    if (!Number.isFinite(nextTime)) return;

    const maxDuration = durationRef.current > 0 ? durationRef.current : Number.POSITIVE_INFINITY;
    const clampedTime = Math.max(0, Math.min(nextTime, maxDuration));

    if (!force && Math.abs(currentTimeRef.current - clampedTime) < 0.05) {
      return;
    }

    currentTimeRef.current = clampedTime;
    renderPlaybackSnapshot(clampedTime, durationRef.current);
    updateActiveCue(clampedTime);
  }, [renderPlaybackSnapshot, updateActiveCue]);

  const clampSeekTime = useCallback((seekTime: number) => {
    const maxDuration = durationRef.current > 0 ? durationRef.current : Number.POSITIVE_INFINITY;
    return Math.max(0, Math.min(seekTime, maxDuration));
  }, []);

  const seekToTime = useCallback((seekTime: number) => {
    if (!Number.isFinite(seekTime)) return;
    if (!ready) return;

    const player = playerRef.current;
    if (!player) return;

    const clampedSeekTime = clampSeekTime(seekTime);

    if (typeof player.seekTo === 'function') {
      player.seekTo(clampedSeekTime, 'seconds');
      return;
    }

    if (typeof player.currentTime === 'number') {
      player.currentTime = clampedSeekTime;
      return;
    }

    if ('currentTime' in player) {
      try {
        player.currentTime = clampedSeekTime;
      } catch {
        // ignore assignment failures on provider-specific elements
      }
    }
  }, [clampSeekTime, ready]);

  const seekBy = useCallback((offsetSeconds: number, opts?: { showControls?: boolean }) => {
    if (!ready || !hasSource || videoError) return;

    const targetTime = clampSeekTime(currentTimeRef.current + offsetSeconds);
    seekToTime(targetTime);
    setCurrentTimeSafely(targetTime, true);
    // Keyboard / button callers always want the controls shown (default true).
    // The touch gesture passes showControls: false to keep controls hidden.
    if (opts?.showControls !== false) {
      resetControlsTimeout();
    }
  }, [ready, hasSource, videoError, clampSeekTime, seekToTime, setCurrentTimeSafely, resetControlsTimeout]);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      // Start the 3s hide countdown whenever playback begins.
      // This covers touch devices where there is no mousemove to trigger the timer.
      resetControlsTimeout();
    }
  }, [playing, resetControlsTimeout]);

  useEffect(() => {
    cuesRef.current = cues;
    activeCueIdRef.current = null;
    activeCueIndexRef.current = -1;
    updateActiveCue(currentTimeRef.current);
  }, [cues, updateActiveCue]);

  useEffect(() => {
    subtitlesEnabledRef.current = subtitlesEnabled;
    updateActiveCue(currentTimeRef.current);
  }, [subtitlesEnabled, updateActiveCue]);

  useEffect(() => {
    subtitleDelaySecondsRef.current = subtitleDelaySeconds;
    updateActiveCue(currentTimeRef.current);
  }, [subtitleDelaySeconds, updateActiveCue]);

  useEffect(() => {
    const handleCustomSeek = (e: Event) => {
      const customEvent = e as CustomEvent<{ seconds: number; play?: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.seconds === 'number') {
        seekToTime(customEvent.detail.seconds);
        setCurrentTimeSafely(customEvent.detail.seconds, true);
        if (customEvent.detail.play !== false) {
          setPlaying(true);
        }
      }
    };
    window.addEventListener('subsync:seek', handleCustomSeek);
    return () => window.removeEventListener('subsync:seek', handleCustomSeek);
  }, [seekToTime, setCurrentTimeSafely]);

  // clearSingleTapTimer must be defined BEFORE the effects that call it
  // (normalizedSrc effect, handleRetry) to avoid a temporal dead zone.
  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }, []);

  // Helper: reset all gesture state (used on src change and retry).
  const resetGestureState = useCallback(() => {
    clearSingleTapTimer();
    lastTapRef.current = null;
    touchStartRef.current = null;
    seekAccumulatorRef.current = 0;
    if (doubleTapFeedbackTimerRef.current) {
      clearTimeout(doubleTapFeedbackTimerRef.current);
      doubleTapFeedbackTimerRef.current = null;
    }
    setDoubleTapFeedback(null);
  }, [clearSingleTapTimer]);

  useEffect(() => {
    setVideoError(null);
    setReady(false);
    setPlaying(false);
    setHasStartedPlaying(false);
    currentTimeRef.current = 0;
    durationRef.current = 0;
    activeCueIdRef.current = null;
    activeCueIndexRef.current = -1;
    setActiveCue(null);
    setDuration(0);
    setPlaybackRate(1);
    setBuffering(false);
    renderPlaybackSnapshot(0, 0);
    resetGestureState(); // clear gesture state on src change
    setPlayerKey((prev) => prev + 1);
  }, [normalizedSrc, renderPlaybackSnapshot, resetGestureState]);

  useEffect(() => {
    if (!hasSource) {
      setVideoError('No video URL provided.');
      setReady(false);
      setBuffering(false);
      return;
    }

    setVideoError(null);
  }, [hasSource]);

  useEffect(() => {
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }

    if (!hasSource || !ReactPlayer || videoError || ready) {
      return;
    }

    readyTimeoutRef.current = setTimeout(() => {
      setBuffering(false);
      setVideoError('Video is taking too long to load. Please verify the URL and try again.');
    }, 15000);

    return () => {
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
    };
  }, [hasSource, ReactPlayer, ready, videoError, playerKey]);

  const prevPlayRequestIdRef = useRef(playRequestId);

  useEffect(() => {
    if (playRequestId === undefined || !hasSource || videoError) return;

    // Only auto-play when playRequestId changes after mount (user explicitly requested play),
    // not on initial render.
    if (prevPlayRequestIdRef.current === playRequestId) return;
    prevPlayRequestIdRef.current = playRequestId;

    setPlaying(true);
  }, [playRequestId, hasSource, videoError]);

  const togglePlay = useCallback(() => {
    if (!videoError && hasSource) {
      setPlaying((prev) => !prev);
    }
  }, [videoError, hasSource]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const applyPlaybackRate = useCallback((nextRate: number) => {
    const player = playerRef.current;
    if (!player) return;

    if (typeof player.setPlaybackRate === 'function') {
      try {
        player.setPlaybackRate(nextRate);
        return;
      } catch {
        // ignore provider-specific failures
      }
    }

    if (typeof player.getInternalPlayer === 'function') {
      const internalPlayer = player.getInternalPlayer();
      if (!internalPlayer) return;

      if (typeof internalPlayer.setPlaybackRate === 'function') {
        try {
          internalPlayer.setPlaybackRate(nextRate);
          return;
        } catch {
          // ignore provider-specific failures
        }
      }

      if ('playbackRate' in internalPlayer) {
        try {
          internalPlayer.playbackRate = nextRate;
        } catch {
          // ignore provider-specific failures
        }
      }
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) {
      setMuted(true);
    } else if (muted) {
      setMuted(false);
    }
  }, [muted]);

  const handlePlaybackRateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRate = Number.parseFloat(e.target.value);
    if (!Number.isFinite(nextRate)) return;

    setPlaybackRate(nextRate);
  }, []);

  useEffect(() => {
    if (!ready || !hasSource || videoError) return;
    applyPlaybackRate(playbackRate);
  }, [ready, hasSource, videoError, playbackRate, applyPlaybackRate]);
  // (Removed dependency-less useEffect that was causing infinite loops)

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    if (!duration || !ready) return;

    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = clampSeekTime(percent * duration);

    seekToTime(seekTime);
    setCurrentTimeSafely(seekTime, true);
  }, [duration, ready, clampSeekTime, seekToTime, setCurrentTimeSafely]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    } else {
      container.requestFullscreen().catch(() => {});
      setFullscreen(true);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setVideoError(null);
    setReady(false);
    setBuffering(false);
    setPlaying(false);
    currentTimeRef.current = 0;
    durationRef.current = 0;
    activeCueIdRef.current = null;
    activeCueIndexRef.current = -1;
    setActiveCue(null);
    setDuration(0);
    renderPlaybackSnapshot(0, 0);
    resetGestureState(); // clear gesture state on retry
    setPlayerKey((prev) => prev + 1);
  }, [renderPlaybackSnapshot, resetGestureState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== document.body
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft': {
          e.preventDefault();
          seekBy(-5);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          seekBy(5);
          break;
        }
        case 'ArrowUp':
          e.preventDefault();
          setVolume((prev) => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((prev) => Math.max(0, prev - 0.1));
          break;
        case 'c':
          e.preventDefault();
          setSubtitlesEnabled((prev) => !prev);
          break;
      }

      resetControlsTimeout();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, seekBy, resetControlsTimeout]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keep playingRef/showControlsRef in sync with state so the single-tap timer
  // reads the correct values without stale closures inside the useCallback.
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { showControlsRef.current = showControls; }, [showControls]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      // Gesture timer cleanup on unmount
      if (doubleTapFeedbackTimerRef.current) clearTimeout(doubleTapFeedbackTimerRef.current);
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  // ── Double-tap-to-seek: touch start ──────────────────────────────────────────
  const handleContainerTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Multi-touch (pinch, zoom): clear start and cancel any pending single-tap timer
    // so a pinch that starts after a first tap doesn't later fire togglePlay.
    if (e.touches.length !== 1) {
      touchStartRef.current = null;
      clearSingleTapTimer();
      return;
    }
    const t = e.touches[0];
    // Record the press time so we can ignore long-presses in handleContainerTouchEnd.
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, [clearSingleTapTimer]);

  // onTouchCancel fires when the finger leaves the screen or the OS interrupts
  // the gesture (e.g. incoming call). Clear any pending state so we don't
  // accidentally toggle play or show stale feedback.
  const handleContainerTouchCancel = useCallback(() => {
    touchStartRef.current = null;
    clearSingleTapTimer();
  }, [clearSingleTapTimer]);

  // ── Double-tap-to-seek: touch end ────────────────────────────────────────────
  const handleContainerTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Ignore if no recorded start (multi-touch was in progress)
    if (!touchStartRef.current) return;

    const changedTouch = e.changedTouches[0];
    if (!changedTouch) return;

    // Ignore if the finger moved too far (scroll / swipe)
    const dx = Math.abs(changedTouch.clientX - touchStartRef.current.x);
    const dy = Math.abs(changedTouch.clientY - touchStartRef.current.y);
    // Also compute press duration to guard against long-presses (see LONG_PRESS_MS).
    const pressDuration = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) {
      clearSingleTapTimer();
      return;
    }
    if (pressDuration > LONG_PRESS_MS) {
      // Long-press: do nothing, do not preventDefault, do not schedule anything
      return;
    }

    // Ignore taps on controls, buttons, selects, inputs, or the progress bar
    // so those interactive elements keep their native behavior.
    const target = e.target as HTMLElement;
    if (target.closest('.video-player-controls, button, select, input, .video-player-progress')) {
      return;
    }

    // Suppress the synthetic click that browsers fire after touchend.
    // This prevents onClick={togglePlay} on .video-player-video from double-firing.
    // Mouse users are unaffected because this handler only runs on touchend.
    if (e.cancelable) e.preventDefault();

    const touchX = changedTouch.clientX;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentSide: 'left' | 'right' = touchX > rect.left + rect.width / 2 ? 'right' : 'left';

    const now = Date.now();
    const last = lastTapRef.current;

    // While a seek chain is active (feedback still visible), any tap on the SAME side
    // extends the chain regardless of the 300ms window (YouTube-style consecutive seeking).
    const inChain = seekAccumulatorRef.current > 0 && last?.side === currentSide;
    const isDoubleTap =
      last !== null &&
      last.side === currentSide &&
      ((now - last.time) < DOUBLE_TAP_DELAY || inChain);

    if (isDoubleTap) {
      // ── Confirmed double-tap / chained seek ───────────────
      clearSingleTapTimer(); // ensure no queued togglePlay

      if (ready && hasSource && !videoError) {
        const offset = currentSide === 'right' ? DOUBLE_TAP_SEEK_SECONDS : -DOUBLE_TAP_SEEK_SECONDS;
        seekBy(offset, { showControls: false }); // don't show controls during gesture

        // Merge label into the state object; no separate dtsLabel state needed.
        seekAccumulatorRef.current += DOUBLE_TAP_SEEK_SECONDS;
        const sign = currentSide === 'right' ? '+' : '-';
        const label = `${sign}${seekAccumulatorRef.current}s`;

        setDoubleTapFeedback((prev) => ({
          side: currentSide,
          id: (prev?.id ?? 0) + 1,
          label,
        }));

        // Reset / restart the hide timer on every chained tap
        if (doubleTapFeedbackTimerRef.current) clearTimeout(doubleTapFeedbackTimerRef.current);
        doubleTapFeedbackTimerRef.current = setTimeout(() => {
          setDoubleTapFeedback(null);
          seekAccumulatorRef.current = 0; // reset accumulator when feedback hides
          doubleTapFeedbackTimerRef.current = null;
        }, 700);
      }

      // Keep lastTap fresh so the NEXT tap within DOUBLE_TAP_DELAY (or while inChain)
      // continues the chain (YouTube-style consecutive seeking).
      lastTapRef.current = { time: now, side: currentSide };
    } else {
      // ── First tap of a potential double-tap ───────────────
      // Side changed: reset the accumulator so the label restarts from ±5s,
      // and immediately clear any stale feedback from the previous side.
      if (last !== null && last.side !== currentSide) {
        seekAccumulatorRef.current = 0;
        if (doubleTapFeedbackTimerRef.current) {
          clearTimeout(doubleTapFeedbackTimerRef.current);
          doubleTapFeedbackTimerRef.current = null;
        }
        setDoubleTapFeedback(null);
      }

      lastTapRef.current = { time: now, side: currentSide };

      if (!videoError && hasSource) {
        clearSingleTapTimer();
        // YouTube-like single-tap behavior:
        //   • Tap while playing AND controls hidden → only reveal controls, don't pause.
        //   • All other cases (paused, or controls already visible) → toggle play.
        // Refs are read inside the timer to avoid stale closures in the useCallback.
        singleTapTimerRef.current = setTimeout(() => {
          singleTapTimerRef.current = null;
          if (playingRef.current && !showControlsRef.current) {
            resetControlsTimeout();
          } else {
            togglePlay();
          }
        }, DOUBLE_TAP_DELAY);
      }
    }
  }, [ready, hasSource, videoError, seekBy, togglePlay, clearSingleTapTimer, resetControlsTimeout]);

  const canSeek = ready && hasSource && !videoError;

  return (
    <div
      ref={containerRef}
      className={`video-player-container ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => playing && setShowControls(false)}
      tabIndex={0}
      onTouchStart={handleContainerTouchStart}
      onTouchEnd={handleContainerTouchEnd}
      onTouchCancel={handleContainerTouchCancel}
    >
      {/* Poster image – visible until user starts playback */}
      {posterUrl && !hasStartedPlaying && !videoError && (
        <div className="video-player-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt="Video poster"
            className="video-player-poster-img"
          />
        </div>
      )}

      {/* onClick toggles play for mouse users. Touch clicks are suppressed by
          e.preventDefault() in handleContainerTouchEnd so this never fires on touch. */}
      <div className="video-player-video" onClick={togglePlay}>
        {!videoError && hasSource && ReactPlayer && (
          <ReactPlayer
            key={`${normalizedSrc}-${playerKey}`}
            ref={playerRef}
            src={normalizedSrc}
            playing={playing}
            playbackRate={playbackRate}
            volume={volume}
            muted={muted}
            controls={false}
            width="100%"
            height="100%"
            playsInline
            onReady={() => {
              setReady(true);
              setBuffering(false);
              setVideoError(null);
            }}
            onLoadedMetadata={(event: unknown) => {
              const nextDuration = extractDuration(event);
              if (nextDuration !== null) {
                setDurationSafely(nextDuration);
              }
              setReady(true);
              setBuffering(false);
              setVideoError(null);
            }}
            onDurationChange={(value: unknown) => {
              const nextDuration = extractDuration(value);
              if (nextDuration !== null) {
                setDurationSafely(nextDuration);
              }
            }}
            onTimeUpdate={(value: unknown) => {
              const nextTime = extractCurrentTime(value);
              if (nextTime !== null) {
                setCurrentTimeSafely(nextTime);
              }
            }}
            onProgress={(value: unknown) => {
              const nextTime = extractCurrentTime(value);
              if (nextTime !== null) {
                setCurrentTimeSafely(nextTime);
              }
            }}
            onPlay={() => {
              setPlaying(true);
              setBuffering(false);
              setHasStartedPlaying(true);
            }}
            onPlaying={() => {
              setBuffering(false);
              setHasStartedPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onWaiting={() => {
              if (ready) {
                setBuffering(true);
              }
            }}
            onError={() => {
              setVideoError('Failed to load this video. Please verify the URL and try again.');
              setBuffering(false);
              setReady(false);
            }}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  controls: 0,
                  autoplay: 0,
                },
              },
              vimeo: {
                controls: false,
                autoplay: false,
              },
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  autoPlay: false,
                },
              },
            } as any}
          />
        )}
        {/* Transparent gesture layer: sits above the react-player iframe so touch
            and click events bubble up to the container for YouTube/Vimeo sources.
            Cross-origin iframes swallow all pointer input; this layer intercepts it. */}
        <div className="video-player-gesture-layer" aria-hidden="true" />
      </div>

      {/* Double-tap-to-seek feedback overlay — additive, temporary, pointer-events:none */}
      {doubleTapFeedback && (
        <div
          key={doubleTapFeedback.id}
          className={`video-player-dts-feedback video-player-dts-feedback--${doubleTapFeedback.side}`}
          aria-hidden="true"
        >
          <span className="video-player-dts-icon">
            {doubleTapFeedback.side === 'right' ? '▶▶' : '◀◀'}
          </span>
          <span className="video-player-dts-label">{doubleTapFeedback.label}</span>
        </div>
      )}

      {activeCue && (
        <SubtitleOverlay
          cue={activeCue}
          settings={subtitleSettings}
          visible={subtitlesEnabled}
        />
      )}

      {buffering && !videoError && (
        <div className="video-player-overlay">
          <Loader2 className="video-player-spinner" />
        </div>
      )}

      {!ready && !videoError && hasSource && (
        <div className="video-player-overlay">
          <Loader2 className="video-player-spinner" />
        </div>
      )}

      {videoError && (
        <div className="video-player-overlay video-player-error-overlay">
          <AlertTriangle className="video-player-error-icon" />
          <p className="video-player-error-text">{videoError}</p>
          <button onClick={handleRetry} className="video-player-retry-btn">
            <RotateCcw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* onClick toggles play for mouse users. Touch events are handled by the
          root container's onTouchEnd; e.preventDefault() there suppresses the
          synthetic click so this onClick never fires on touch devices. */}
      {!playing && !videoError && ready && (
        <div className="video-player-overlay video-player-play-overlay" onClick={togglePlay}>
          <div className="video-player-big-play">
            <Play size={36} fill="white" />
          </div>
        </div>
      )}

      {subtitleUrl && subtitleLoading && (
        <div className="video-player-subtitle-status">
          <Loader2 size={14} className="video-player-spinner-small" />
          Loading subtitles...
        </div>
      )}

      {subtitleUrl && subtitleError && (
        <div className="video-player-subtitle-status video-player-subtitle-error">
          <AlertTriangle size={14} />
          {subtitleError}
        </div>
      )}

      <div className={`video-player-controls ${showControls ? 'visible' : ''}`}>
        <div className="video-player-progress" onClick={handleSeek}>
          <div className="video-player-progress-bg" />
          <div ref={progressFillRef} className="video-player-progress-fill" />
          <div ref={progressThumbRef} className="video-player-progress-thumb" />
        </div>

        <div className="video-player-controls-row">
          <div className="video-player-controls-left">
            <button onClick={togglePlay} className="video-player-btn" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={20} /> : <Play size={20} fill="white" />}
            </button>

            <button
              onClick={() => seekBy(-5)}
              className="video-player-btn video-player-seek-btn"
              aria-label="Back 5 seconds"
              title="Back 5s"
              disabled={!canSeek}
            >
              <SkipBack size={16} />
              <span>Back 5s</span>
            </button>

            <button
              onClick={() => seekBy(5)}
              className="video-player-btn video-player-seek-btn"
              aria-label="Forward 5 seconds"
              title="Forward 5s"
              disabled={!canSeek}
            >
              <SkipForward size={16} />
              <span>Forward 5s</span>
            </button>

            <div
              className="video-player-volume-group"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button onClick={toggleMute} className="video-player-btn" aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <div className={`video-player-volume-slider ${showVolumeSlider ? 'visible' : ''}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="video-player-volume-input"
                />
              </div>
            </div>

            <span ref={timeDisplayRef} className="video-player-time" />
          </div>

          <div className="video-player-controls-right">
            <div className="video-player-speed-control">
              <label className="video-player-speed-label" htmlFor={`video-player-speed-${playerKey}`}>
                Speed
              </label>
              <select
                id={`video-player-speed-${playerKey}`}
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className="video-player-speed-select"
                disabled={!ready || !!videoError}
              >
                {SPEED_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}x
                  </option>
                ))}
              </select>
            </div>

            {subtitleUrl && cues.length > 0 && (
              <button
                onClick={() => setSubtitlesEnabled((prev) => !prev)}
                className={`video-player-btn ${subtitlesEnabled ? 'active' : ''}`}
                aria-label="Toggle subtitles"
                title={subtitlesEnabled ? 'Subtitles ON' : 'Subtitles OFF'}
              >
                <Subtitles size={20} />
              </button>
            )}

            <button onClick={toggleFullscreen} className="video-player-btn" aria-label="Toggle fullscreen">
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
