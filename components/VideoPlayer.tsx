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
  subtitleUrl = null,
  subtitleSettings = {},
  subtitleDelaySeconds = 0,
  className = '',
  playRequestId,
}: VideoPlayerProps) {
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
  const subtitlesEnabledRef = useRef(true);
  const subtitleDelaySecondsRef = useRef(subtitleDelaySeconds);

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

  const seekBy = useCallback((offsetSeconds: number) => {
    if (!ready || !hasSource || videoError) return;

    const targetTime = clampSeekTime(currentTimeRef.current + offsetSeconds);
    seekToTime(targetTime);
    setCurrentTimeSafely(targetTime, true);
    resetControlsTimeout();
  }, [ready, hasSource, videoError, clampSeekTime, seekToTime, setCurrentTimeSafely, resetControlsTimeout]);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [playing]);

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
      const customEvent = e as CustomEvent<{ seconds: number }>;
      if (customEvent.detail && typeof customEvent.detail.seconds === 'number') {
        seekToTime(customEvent.detail.seconds);
        setCurrentTimeSafely(customEvent.detail.seconds, true);
        setPlaying(true);
      }
    };
    window.addEventListener('subsync:seek', handleCustomSeek);
    return () => window.removeEventListener('subsync:seek', handleCustomSeek);
  }, [seekToTime, setCurrentTimeSafely]);

  useEffect(() => {
    setVideoError(null);
    setReady(false);
    setPlaying(false);
    currentTimeRef.current = 0;
    durationRef.current = 0;
    activeCueIdRef.current = null;
    activeCueIndexRef.current = -1;
    setActiveCue(null);
    setDuration(0);
    setPlaybackRate(1);
    setBuffering(false);
    renderPlaybackSnapshot(0, 0);
    setPlayerKey((prev) => prev + 1);
  }, [normalizedSrc, renderPlaybackSnapshot]);

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

  useEffect(() => {
    if (playRequestId === undefined || !hasSource || videoError) return;

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
    setPlayerKey((prev) => prev + 1);
  }, [renderPlaybackSnapshot]);

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

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const canSeek = ready && hasSource && !videoError;

  return (
    <div
      ref={containerRef}
      className={`video-player-container ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => playing && setShowControls(false)}
      tabIndex={0}
    >
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
            }}
            onPlaying={() => {
              setBuffering(false);
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
                modestbranding: 1,
                rel: 0,
                controls: 0,
              },
              vimeo: {
                controls: false,
              },
              html: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            } as any}
          />
        )}
      </div>

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
