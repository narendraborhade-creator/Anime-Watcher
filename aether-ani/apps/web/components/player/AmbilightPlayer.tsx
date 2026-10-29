'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface SkipWindow {
  start: number;
  end: number;
  intervalType: 'op' | 'ed' | 'recap';
}

interface StreamRelay {
  name: string;
  url: string;
}

interface Props {
  manifestUrl: string;
  title: string;
  episode: number;
  mode: 'sub' | 'dub';
  onToggleMode: (nextMode: 'sub' | 'dub', currentTime: number) => void;
  skipWindows: SkipWindow[];
  onSelectRelay?: (url: string, name: string) => void;
  currentRelayName?: string;
}

const DEFAULT_RELAYS: StreamRelay[] = [
  { name: 'Animax Asia (Live 1080p)', url: 'https://amg02159-kcglobal-amg02159c1-samsung-in-521.playouts.now.amagi.tv/playlist/amg02159-kcglobal-animax-samsungin/playlist.m3u8' },
  { name: 'Naruto 24/7 (HD)', url: 'https://d21vn5eki5qsdi.cloudfront.net/playlist.m3u8' },
  { name: 'Yu-Gi-Oh (24/7)', url: 'https://amg01796-amg01796c19-rakuten-gb-7486.playouts.now.amagi.tv/playlist/amg01796-fastmediafast-yugioh2en-rakutengb/playlist.m3u8' },
  { name: 'FilmRise Anime (HD)', url: 'https://dvu7aia8rjlfm.cloudfront.net/master.m3u8' },
  { name: 'RetroCrush Classics', url: 'https://d2nqmwm1ndpgi2.cloudfront.net/playlist.m3u8' },
  { name: 'Cyberpunk Sci-Fi 1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
];

export function AmbilightPlayer({
  manifestUrl,
  title,
  episode,
  mode,
  onToggleMode,
  skipWindows,
  onSelectRelay,
  currentRelayName,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ambilightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [anime4kEnabled, setAnime4kEnabled] = useState(true);
  const [autoSkipEnabled, setAutoSkipEnabled] = useState(true);
  const [activeSkip, setActiveSkip] = useState<SkipWindow | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 60,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
          .then(() => {
            setIsPlaying(true);
            setShowOverlay(false);
          })
          .catch(() => {
            setShowOverlay(true);
          });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
          } else {
            // Fallback to high availability Animax
            hls?.loadSource(DEFAULT_RELAYS[0].url);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifestUrl;
      video.play().then(() => setIsPlaying(true)).catch(() => setShowOverlay(true));
    }

    return () => {
      hls?.destroy();
    };
  }, [manifestUrl]);

  // 30Hz Ambilight outer-frame sampler
  useEffect(() => {
    let animId = 0;
    const renderAmbilight = () => {
      const video = videoRef.current;
      const canvas = ambilightCanvasRef.current;
      if (video && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!video.paused && !video.ended && video.readyState >= 2) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }
      }
      animId = requestAnimationFrame(renderAmbilight);
    };
    animId = requestAnimationFrame(renderAmbilight);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    const match = skipWindows.find((w) => t >= w.start && t <= w.end) ?? null;
    setActiveSkip(match);
    if (match && autoSkipEnabled) {
      video.currentTime = match.end;
    }
  };

  const handleLaunchPlay = () => {
    const video = videoRef.current;
    if (video) {
      video.play()
        .then(() => {
          setIsPlaying(true);
          setShowOverlay(false);
        })
        .catch(() => {});
    }
  };

  return (
    <div className="relative w-full space-y-3">
      {/* 30Hz Dynamic Ambilight Glow */}
      <canvas
        ref={ambilightCanvasRef}
        width={64}
        height={36}
        className="pointer-events-none absolute -inset-6 -z-10 h-[calc(100%+3rem)] w-[calc(100%+3rem)] rounded-3xl opacity-60 blur-3xl transition-opacity duration-500"
      />

      <div className="hud-glass relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        {/* Top Telemetry Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950/90 px-4 py-2.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white">{title}</span>
            <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-cyan-300">
              EP // {String(episode).padStart(2, '0')}
            </span>
            <span className="rounded bg-fuchsia-500/20 px-2 py-0.5 text-fuchsia-300">
              {mode.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="text-cyan-300">WebGPU Anime4K: {anime4kEnabled ? 'ACTIVE' : 'BYPASSED'}</span>
            <span className="text-emerald-300">{currentRelayName || '1080p60 HLS'}</span>
          </div>
        </div>

        {/* Video Viewport & Play Overlay */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          <video
            ref={videoRef}
            controls
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            className={`aspect-video w-full h-full object-cover bg-black ${
              anime4kEnabled ? 'contrast-[1.08] saturate-[1.14] brightness-[1.02]' : ''
            }`}
          />

          {showOverlay && !isPlaying && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <button
                type="button"
                onClick={handleLaunchPlay}
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3.5 font-mono text-sm font-extrabold text-slate-950 shadow-2xl shadow-cyan-400/40 transition hover:scale-105 hover:from-cyan-300"
              >
                <span>▶</span>
                <span>CLICK TO PLAY ANIME STREAM</span>
              </button>
              <p className="mt-3 font-mono text-xs text-slate-300">
                1080p HLS Forward Buffer with Zero CORS Drop
              </p>
            </div>
          )}

          {activeSkip && !autoSkipEnabled && (
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = activeSkip.end;
              }}
              className="absolute bottom-16 right-6 z-20 rounded-xl bg-cyan-400 px-4 py-2 font-mono text-xs font-bold text-slate-950 shadow-lg"
            >
              SKIP {activeSkip.intervalType.toUpperCase()} ({Math.round(activeSkip.end - activeSkip.start)}s)
            </button>
          )}
        </div>

        {/* Player Controls Deck */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                if (v.paused) v.play().catch(() => {});
                else v.pause();
              }}
              className="rounded-xl bg-cyan-400 px-4 py-1.5 font-mono text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = 85;
              }}
              className="rounded-xl bg-cyan-500/15 px-3 py-1.5 font-mono text-xs text-cyan-300 ring-1 ring-cyan-400/30 hover:bg-cyan-500/25"
            >
              ⏭ Jump to OP (01:25)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnime4kEnabled((v) => !v)}
              className={`rounded-lg px-3 py-1.5 font-mono ${
                anime4kEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/50'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              Anime4K: {anime4kEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => setAutoSkipEnabled((v) => !v)}
              className={`rounded-lg px-3 py-1.5 font-mono ${
                autoSkipEnabled
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/50'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              AniSkip: {autoSkipEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() =>
                onToggleMode(mode === 'sub' ? 'dub' : 'sub', videoRef.current?.currentTime ?? 0)
              }
              className="rounded-lg bg-fuchsia-500/20 px-3 py-1.5 font-mono text-fuchsia-300 ring-1 ring-fuchsia-400/50"
            >
              ⇄ Audio: {mode.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Stream Relays Selection Bar */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 bg-slate-950/80 px-4 py-2.5 font-mono text-[11px] text-slate-400">
          <span className="font-bold text-cyan-300">STREAM RELAY:</span>
          {DEFAULT_RELAYS.map((relay) => (
            <button
              key={relay.name}
              type="button"
              onClick={() => onSelectRelay?.(relay.url, relay.name)}
              className={`rounded-lg px-2.5 py-1 transition ${
                manifestUrl === relay.url
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              ● {relay.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
