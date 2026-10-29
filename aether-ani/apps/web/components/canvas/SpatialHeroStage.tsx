'use client';

import React from 'react';

interface Props {
  title: string;
  synopsis: string;
  episodeCount: number;
  bannerImage?: string;
  score?: number;
  studio?: string;
  genreTag?: string;
  onWatchNow: () => void;
  onOpenCommandBar: () => void;
}

export function SpatialHeroStage({
  title,
  synopsis,
  episodeCount,
  bannerImage,
  score,
  studio,
  genreTag,
  onWatchNow,
  onOpenCommandBar,
}: Props) {
  return (
    <section className="hud-glass relative overflow-hidden rounded-3xl p-6 md:p-12 border border-white/10 shadow-2xl">
      {bannerImage && (
        <>
          <img
            src={bannerImage}
            alt={title}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-700 ease-out hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06070B] via-[#06070B]/85 to-transparent" />
        </>
      )}

      <div className="relative z-10 max-w-2xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 font-mono text-xs text-cyan-300 ring-1 ring-cyan-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>ORBITAL STREAM ENGINE // PYSTARDUST/ANI-CLI V5.1</span>
          </span>
          {genreTag && (
            <span className="rounded-md bg-white/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-200">
              {genreTag}
            </span>
          )}
          {score && (
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
              ★ {score}%
            </span>
          )}
        </div>

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          {title}
        </h1>

        <p className="text-sm leading-relaxed text-slate-300 line-clamp-3 md:text-base">
          {synopsis}
        </p>

        {studio && (
          <div className="font-mono text-xs text-cyan-300">
            STUDIO: <span className="text-white">{studio}</span> • {episodeCount} EPISODES
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onWatchNow}
            className="rounded-xl bg-cyan-400 px-6 py-3 font-mono text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300 hover:scale-[1.02]"
          >
            ▶ STREAM NOW ({episodeCount} EPS)
          </button>
          <button
            type="button"
            onClick={onOpenCommandBar}
            className="rounded-xl bg-white/10 px-5 py-3 font-mono text-xs text-slate-200 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-cyan-300"
          >
            &gt;_ CMD + K // NEURAL FZF BAR
          </button>
        </div>
      </div>
    </section>
  );
}
