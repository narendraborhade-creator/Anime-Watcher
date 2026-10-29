'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AmbilightPlayer } from '../../../components/player/AmbilightPlayer';
import { NeuralOmniBar } from '../../../components/command/NeuralOmniBar';

interface AnimeItem {
  id: number;
  slug: string;
  title: string;
  episodes: number;
  score: number;
  studio: string;
  synopsis: string;
  poster: string;
  bannerImage: string;
  streamUrl: string;
  streamName: string;
}

const FALLBACK_ANIME: AnimeItem = {
  id: 16498,
  slug: 'attack-on-titan',
  title: 'Attack on Titan',
  episodes: 25,
  score: 89,
  studio: 'WIT STUDIO',
  synopsis: 'Several hundred years ago, humans were nearly exterminated by titans. Eren Jaeger and the Scout Regiment fight for the survival of humanity.',
  poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
  bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg',
  streamUrl: 'https://amg02159-kcglobal-amg02159c1-samsung-in-521.playouts.now.amagi.tv/playlist/amg02159-kcglobal-animax-samsungin/playlist.m3u8',
  streamName: 'Animax Asia 1080p Live',
};

export default function WatchPage() {
  const params = useParams();
  const anilistId = Number(params?.anilistId) || 16498;

  const [anime, setAnime] = useState<AnimeItem>(FALLBACK_ANIME);
  const [episode, setEpisode] = useState(1);
  const [mode, setMode] = useState<'sub' | 'dub'>('sub');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState(FALLBACK_ANIME.streamUrl);
  const [streamName, setStreamName] = useState(FALLBACK_ANIME.streamName);
  const [skipWindows, setSkipWindows] = useState<Array<{ start: number; end: number; intervalType: 'op' | 'ed' | 'recap' }>>([
    { start: 85, end: 175, intervalType: 'op' },
    { start: 1290, end: 1380, intervalType: 'ed' },
  ]);

  // Dynamic AniSkip SWR Fetcher
  useEffect(() => {
    async function fetchAniSkip() {
      try {
        const url = `https://api.aniskip.com/v2/skip-times/${anilistId}/${episode}?types[]=op&types[]=ed&types[]=recap&episodeLength=0`;
        const res = await fetch(url);
        if (!res.ok) return;
        const d = await res.json();
        if (d && d.found && Array.isArray(d.results)) {
          const windows: Array<{ start: number; end: number; intervalType: 'op' | 'ed' | 'recap' }> = d.results.map((r: any) => ({
            start: r.interval.startTime,
            end: r.interval.endTime,
            intervalType: r.skipType,
          }));
          if (windows.length > 0) setSkipWindows(windows);
        }
      } catch {}
    }
    fetchAniSkip();
  }, [anilistId, episode]);

  useEffect(() => {
    async function fetchAnime() {
      try {
        const query = `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id title { romaji english } coverImage { extraLarge color } bannerImage
              description(asHtml: false) episodes averageScore genres
              studios(isMain: true) { nodes { name } }
            }
          }
        `;
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { id: anilistId } }),
        });
        const data = await res.json();
        const m = data?.data?.Media;
        if (m) {
          const cleanTitle = m.title.english || m.title.romaji;
          setAnime({
            id: m.id,
            slug: cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title: cleanTitle,
            episodes: m.episodes || 24,
            score: m.averageScore || 85,
            studio: m.studios?.nodes?.[0]?.name || 'Top Anime Studio',
            synopsis: (m.description || '').replace(/<[^>]+>/g, '').slice(0, 240),
            poster: m.coverImage?.extraLarge || '',
            bannerImage: m.bannerImage || m.coverImage?.extraLarge || '',
            streamUrl: 'https://amg02159-kcglobal-amg02159c1-samsung-in-521.playouts.now.amagi.tv/playlist/amg02159-kcglobal-animax-samsungin/playlist.m3u8',
            streamName: 'Animax Asia 1080p Live',
          });
        }
      } catch {
        // Fallback to default
      }
    }
    fetchAnime();
  }, [anilistId]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between font-mono text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-cyan-400 hover:underline">
            ← BACK TO CATALOG
          </Link>
          <span>/</span>
          <span className="text-white">{anime.title}</span>
          <span>/</span>
          <span className="text-cyan-300">EP {String(episode).padStart(2, '0')}</span>
        </div>
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="rounded-lg bg-white/10 px-3 py-1 text-slate-200 hover:bg-white/15"
        >
          &gt;_ CMD + K
        </button>
      </div>

      {/* Cinema Player Stage */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <AmbilightPlayer
            manifestUrl={streamUrl}
            title={anime.title}
            episode={episode}
            mode={mode}
            onToggleMode={(nextMode) => setMode(nextMode)}
            onSelectRelay={(url, name) => {
              setStreamUrl(url);
              setStreamName(name);
            }}
            currentRelayName={streamName}
            skipWindows={skipWindows}
          />

          {/* Anime Synopsis & Credits Card */}
          <div className="hud-glass rounded-2xl p-6 border border-white/10">
            <h1 className="font-display text-2xl font-bold text-white">{anime.title}</h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">{anime.synopsis}</p>
            <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs text-slate-400">
              <div>STUDIO: <span className="text-white">{anime.studio}</span></div>
              <div>RATING: <span className="text-emerald-400">★ {anime.score}%</span></div>
              <div>TOTAL EPISODES: <span className="text-cyan-300">{anime.episodes}</span></div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Episode Selector Matrix & Watch Party */}
        <div className="space-y-4 lg:col-span-4">
          <div className="hud-glass rounded-2xl p-5 border border-white/10 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-bold text-white">EPISODE MATRIX</h2>
                <p className="font-mono text-[11px] text-cyan-300">
                  {anime.title} ({anime.episodes} EPS)
                </p>
              </div>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                L2 READY
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {Array.from({ length: Math.min(anime.episodes || 24, 24) }, (_, i) => i + 1).map((ep) => {
                const isActive = ep === episode;
                return (
                  <button
                    key={ep}
                    type="button"
                    onClick={() => setEpisode(ep)}
                    className={`rounded-xl py-2.5 font-mono text-xs transition ${
                      isActive
                        ? 'bg-cyan-400 font-extrabold text-slate-950 shadow-md shadow-cyan-400/30'
                        : 'bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    EP {String(ep).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <NeuralOmniBar
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onExecute={(cmd) => {
          setEpisode(cmd.episode);
          setMode(cmd.mode);
        }}
      />
    </main>
  );
}
