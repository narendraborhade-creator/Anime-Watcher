'use client';

import React, { useState, useEffect } from 'react';
import { SpatialHeroStage } from '../components/canvas/SpatialHeroStage';
import { AmbilightPlayer } from '../components/player/AmbilightPlayer';
import { NeuralOmniBar } from '../components/command/NeuralOmniBar';
import { ParsedAniCliCommand } from '@aether-ani/shared-schemas';

interface AnimeItem {
  id: number;
  malId?: number | null;
  source?: 'anilist' | 'kitsu' | 'ghibli';
  slug: string;
  title: string;
  nativeTitle?: string;
  genreTag: string;
  episodes: number;
  score: number;
  studio: string;
  accentPrimary: string;
  accentSecondary: string;
  poster: string;
  bannerImage: string;
  synopsis: string;
  streamUrl: string;
  streamName: string;
}

const INITIAL_CATALOG: AnimeItem[] = [
  {
    id: 16498,
    slug: 'attack-on-titan',
    title: 'Attack on Titan',
    nativeTitle: '進撃の巨人',
    genreTag: 'DARK FANTASY',
    episodes: 25,
    score: 89,
    studio: 'WIT STUDIO',
    accentPrimary: '#f1a143',
    accentSecondary: '#6366F1',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg',
    synopsis: 'Several hundred years ago, humans were nearly exterminated by titans. Now, Eren Jaeger and the Scout Regiment fight for the survival of humanity within the towering walls.',
    streamUrl: 'https://amg02159-kcglobal-amg02159c1-samsung-in-521.playouts.now.amagi.tv/playlist/amg02159-kcglobal-animax-samsungin/playlist.m3u8',
    streamName: 'Animax Asia 1080p Live',
  },
  {
    id: 20,
    slug: 'naruto',
    title: 'Naruto',
    nativeTitle: 'NARUTO -ナルト-',
    genreTag: 'SHONEN',
    episodes: 220,
    score: 80,
    studio: 'Studio Pierrot',
    accentPrimary: '#FF7700',
    accentSecondary: '#0099FF',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-dE6UHbFFg1A5.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20-HHxhPj5JD13a.jpg',
    synopsis: 'Naruto Uzumaki, a hyperactive and knuckle-headed ninja, dreams of becoming Hokage, the strongest ninja in Konohagakure village.',
    streamUrl: 'https://d21vn5eki5qsdi.cloudfront.net/playlist.m3u8',
    streamName: 'Naruto 24/7 HD',
  },
  {
    id: 113415,
    slug: 'jujutsu-kaisen',
    title: 'JUJUTSU KAISEN',
    nativeTitle: '呪術廻戦',
    genreTag: 'DARK FANTASY',
    episodes: 24,
    score: 87,
    studio: 'MAPPA',
    accentPrimary: '#e45d5d',
    accentSecondary: '#6366F1',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    synopsis: 'Hardship, regret, shame: the negative feelings that humans feel become Curses that lurk in everyday lives. Yuji Itadori enters Tokyo Jujutsu High to break the curse.',
    streamUrl: 'https://dvu7aia8rjlfm.cloudfront.net/master.m3u8',
    streamName: 'FilmRise Anime HD',
  },
  {
    id: 101922,
    slug: 'demon-slayer',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    nativeTitle: '鬼滅の刃',
    genreTag: 'DARK FANTASY',
    episodes: 26,
    score: 85,
    studio: 'ufotable',
    accentPrimary: '#f1c9ae',
    accentSecondary: '#6366F1',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg',
    synopsis: 'Tanjiro, a kindhearted boy who sells charcoal, finds his family slaughtered by a demon. His sister Nezuko, the sole survivor, has been transformed into a demon.',
    streamUrl: 'https://amg02159-kcglobal-amg02159c1-samsung-in-521.playouts.now.amagi.tv/playlist/amg02159-kcglobal-animax-samsungin/playlist.m3u8',
    streamName: 'Animax Asia 1080p Live',
  },
  {
    id: 130591,
    slug: 'cyberpunk-edgerunners',
    title: 'Cyberpunk: Edgerunners',
    nativeTitle: 'サイバーパンク エッジランナーズ',
    genreTag: 'CYBERPUNK',
    episodes: 10,
    score: 86,
    studio: 'Studio Trigger',
    accentPrimary: '#00F0FF',
    accentSecondary: '#FE286B',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130591-D5BCvdLsNmzA.png',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/130591-sHqKbxYwZqK8.jpg',
    synopsis: 'A street kid trying to survive in a technology and body modification-obsessed city of the future decides to stay alive by becoming an edgerunner: a mercenary outlaw.',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    streamName: 'Cyberpunk Sci-Fi 1080p',
  },
  {
    id: 1535,
    slug: 'death-note',
    title: 'Death Note',
    nativeTitle: 'DEATH NOTE',
    genreTag: 'DARK FANTASY',
    episodes: 37,
    score: 84,
    studio: 'MADHOUSE',
    accentPrimary: '#00F0FF',
    accentSecondary: '#6366F1',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535.jpg',
    synopsis: 'Light Yagami finds a supernatural notebook that grants the ability to kill anyone whose name and face are known.',
    streamUrl: 'https://amg01796-amg01796c19-rakuten-gb-7486.playouts.now.amagi.tv/playlist/amg01796-fastmediafast-yugioh2en-rakutengb/playlist.m3u8',
    streamName: 'Yu-Gi-Oh 24/7 HD',
  },
  {
    id: 21087,
    slug: 'one-punch-man',
    title: 'One-Punch Man',
    nativeTitle: 'ワンパンマン',
    genreTag: 'SHONEN',
    episodes: 12,
    score: 82,
    studio: 'MADHOUSE',
    accentPrimary: '#e4ae5d',
    accentSecondary: '#6366F1',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21087-sHb9zUZFsHe1.jpg',
    synopsis: 'Saitama has a rather peculiar hobby: being a superhero. Having grown effortlessly strong, he can defeat any opponent with a single punch.',
    streamUrl: 'https://amg02159-kcglobal-amg02159c1-samsung-in-521.playouts.now.amagi.tv/playlist/amg02159-kcglobal-animax-samsungin/playlist.m3u8',
    streamName: 'Animax Asia 1080p Live',
  },
  {
    id: 21,
    slug: 'one-piece',
    title: 'ONE PIECE',
    nativeTitle: 'ONE PIECE',
    genreTag: 'SHONEN',
    episodes: 24,
    score: 87,
    studio: 'Toei Animation',
    accentPrimary: '#e49335',
    accentSecondary: '#6366F1',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
    synopsis: 'Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become the king of all pirates.',
    streamUrl: 'https://d21vn5eki5qsdi.cloudfront.net/playlist.m3u8',
    streamName: 'Naruto 24/7 HD',
  },
  {
    id: 5114,
    slug: 'fullmetal-alchemist-brotherhood',
    title: 'Fullmetal Alchemist: Brotherhood',
    nativeTitle: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    genreTag: 'DARK FANTASY',
    episodes: 64,
    score: 90,
    studio: 'bones',
    accentPrimary: '#e4c993',
    accentSecondary: '#6366F1',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-nSWCgQlmOMtj.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-q0V5URebphSG.jpg',
    synopsis: 'Edward and Alphonse Elric search for the Philosopher\'s Stone to restore their bodies after a failed transmutation.',
    streamUrl: 'https://d2nqmwm1ndpgi2.cloudfront.net/playlist.m3u8',
    streamName: 'RetroCrush Classics HD',
  },
];

export default function HomePage() {
  const [catalog, setCatalog] = useState<AnimeItem[]>(INITIAL_CATALOG);
  const [activeAnime, setActiveAnime] = useState<AnimeItem>(INITIAL_CATALOG[0]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [episode, setEpisode] = useState(1);
  const [mode, setMode] = useState<'sub' | 'dub'>('sub');
  const [filter, setFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [streamUrl, setStreamUrl] = useState(INITIAL_CATALOG[0].streamUrl);
  const [streamName, setStreamName] = useState(INITIAL_CATALOG[0].streamName);
  const [skipWindows, setSkipWindows] = useState<Array<{ start: number; end: number; intervalType: 'op' | 'ed' | 'recap' }>>([
    { start: 85, end: 175, intervalType: 'op' },
    { start: 1290, end: 1380, intervalType: 'ed' },
  ]);

  // Trace.moe Optical Search state
  const [traceUrl, setTraceUrl] = useState('');
  const [traceStatus, setTraceStatus] = useState('Ready to recognize anime frames with Trace.moe.');
  const [traceMatch, setTraceMatch] = useState<{ title: string; episode: number; timeSec: number; sim: string; thumb: string }>({
    title: 'Attack on Titan',
    episode: 1,
    timeSec: 480,
    sim: '98.4%',
    thumb: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
  });

  // Federated Multi-Source Hydration (public-apis/public-apis#anime)
  useEffect(() => {
    async function hydrateFederatedMesh() {
      const streams = [
        { name: 'Animax Asia 1080p Live', url: 'https://amg02159-kcglobal-amg02159c1-samsung-in-521.playouts.now.amagi.tv/playlist/amg02159-kcglobal-animax-samsungin/playlist.m3u8' },
        { name: 'Naruto 24/7 HD', url: 'https://d21vn5eki5qsdi.cloudfront.net/playlist.m3u8' },
        { name: 'FilmRise Anime HD', url: 'https://dvu7aia8rjlfm.cloudfront.net/master.m3u8' },
        { name: 'Yu-Gi-Oh 24/7 HD', url: 'https://amg01796-amg01796c19-rakuten-gb-7486.playouts.now.amagi.tv/playlist/amg01796-fastmediafast-yugioh2en-rakutengb/playlist.m3u8' },
        { name: 'RetroCrush Classics HD', url: 'https://d2nqmwm1ndpgi2.cloudfront.net/playlist.m3u8' },
        { name: 'Cyberpunk Sci-Fi 1080p', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
      ];

      try {
        // Fetch AniList GraphQL, Kitsu REST & Studio Ghibli in parallel
        const anilistPromise = fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query {
                Page(page: 1, perPage: 12) {
                  media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
                    id idMal title { romaji english } coverImage { extraLarge color } bannerImage
                    description(asHtml: false) episodes averageScore genres
                    studios(isMain: true) { nodes { name } }
                  }
                }
              }
            `,
          }),
        }).then((r) => r.json()).catch(() => null);

        const kitsuPromise = fetch('https://kitsu.io/api/edge/anime?page[limit]=10&sort=-userCount')
          .then((r) => r.json()).catch(() => null);

        const ghibliPromise = fetch('https://ghibliapi.vercel.app/films')
          .then((r) => r.json()).catch(() => null);

        const [anilistData, kitsuData, ghibliData] = await Promise.all([anilistPromise, kitsuPromise, ghibliPromise]);

        const merged: AnimeItem[] = [];

        // 1. AniList
        const media = anilistData?.data?.Page?.media;
        if (Array.isArray(media)) {
          media.forEach((m: any, i: number) => {
            const s = streams[i % streams.length];
            const cleanTitle = m.title.english || m.title.romaji;
            let tag = 'ACTION';
            if (m.genres?.includes('Sci-Fi')) tag = 'CYBERPUNK';
            else if (m.genres?.includes('Fantasy') || m.genres?.includes('Supernatural')) tag = 'DARK FANTASY';
            else if (m.genres?.includes('Action')) tag = 'SHONEN';

            merged.push({
              id: m.id,
              malId: m.idMal || m.id,
              source: 'anilist',
              slug: cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              title: cleanTitle,
              genreTag: tag,
              episodes: m.episodes || 24,
              score: m.averageScore || 85,
              studio: m.studios?.nodes?.[0]?.name || 'Top Anime Studio',
              accentPrimary: m.coverImage?.color || '#00F0FF',
              accentSecondary: '#6366F1',
              poster: m.coverImage?.extraLarge || '',
              bannerImage: m.bannerImage || m.coverImage?.extraLarge || '',
              synopsis: (m.description || '').replace(/<[^>]+>/g, '').slice(0, 240),
              streamUrl: s.url,
              streamName: s.name,
            });
          });
        }

        // 2. Kitsu
        if (Array.isArray(kitsuData?.data)) {
          kitsuData.data.forEach((item: any, i: number) => {
            const attr = item.attributes;
            const cleanTitle = attr.canonicalTitle || attr.titles?.en || 'Kitsu Anime';
            const s = streams[(i + 2) % streams.length];
            merged.push({
              id: 70000 + (parseInt(item.id, 10) || i),
              malId: null,
              source: 'kitsu',
              slug: cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              title: cleanTitle,
              genreTag: 'SHONEN',
              episodes: attr.episodeCount || 24,
              score: Math.round(parseFloat(attr.averageRating || '82')),
              studio: 'Kitsu Partner',
              accentPrimary: '#6366F1',
              accentSecondary: '#FE286B',
              poster: attr.posterImage?.large || attr.posterImage?.original || '',
              bannerImage: attr.coverImage?.large || attr.posterImage?.large || '',
              synopsis: (attr.synopsis || '').slice(0, 240),
              streamUrl: s.url,
              streamName: s.name,
            });
          });
        }

        // 3. Studio Ghibli
        if (Array.isArray(ghibliData)) {
          ghibliData.slice(0, 8).forEach((film: any, i: number) => {
            const s = streams[(i + 4) % streams.length];
            merged.push({
              id: 90000 + i,
              malId: null,
              source: 'ghibli',
              slug: film.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              title: film.title,
              genreTag: 'DARK FANTASY',
              episodes: 1,
              score: parseInt(film.rt_score, 10) || 94,
              studio: 'Studio Ghibli',
              accentPrimary: '#10B981',
              accentSecondary: '#F59E0B',
              poster: film.image || '',
              bannerImage: film.movie_banner || film.image || '',
              synopsis: (film.description || '').slice(0, 240),
              streamUrl: s.url,
              streamName: s.name,
            });
          });
        }

        if (merged.length > 0) {
          setCatalog(merged);
          setActiveAnime(merged[0]);
          setStreamUrl(merged[0].streamUrl);
          setStreamName(merged[0].streamName);
        }
      } catch {
        // Fallback to static catalog on offline
      }
    }

    hydrateFederatedMesh();
  }, []);

  // AniSkip Skip Times fetcher
  useEffect(() => {
    async function updateSkipTimes() {
      if (!activeAnime.malId) return;
      try {
        const url = `https://api.aniskip.com/v2/skip-times/${activeAnime.malId}/${episode}?types[]=op&types[]=ed&types[]=recap&episodeLength=0`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.found && Array.isArray(data.results)) {
          const windows: Array<{ start: number; end: number; intervalType: 'op' | 'ed' | 'recap' }> = data.results.map((r: any) => ({
            start: r.interval.startTime,
            end: r.interval.endTime,
            intervalType: r.skipType,
          }));
          if (windows.length > 0) {
            setSkipWindows(windows);
          }
        }
      } catch {
        // Retain default skip windows
      }
    }
    updateSkipTimes();
  }, [activeAnime, episode]);

  const handleSelectAnime = (anime: AnimeItem, ep = 1) => {
    setActiveAnime(anime);
    setEpisode(ep);
    setStreamUrl(anime.streamUrl);
    setStreamName(anime.streamName);
    document.documentElement.style.setProperty('--glow-primary', anime.accentPrimary);
    document.documentElement.style.setProperty('--glow-secondary', anime.accentSecondary);

    const playerEl = document.getElementById('cinemaPlayerSection');
    if (playerEl) playerEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExecuteCommand = (cmd: ParsedAniCliCommand) => {
    const qLower = cmd.query.toLowerCase().trim();
    const matched =
      catalog.find(
        (a) => a.title.toLowerCase().includes(qLower) || a.slug.includes(qLower)
      ) || catalog[0];

    handleSelectAnime(matched, cmd.episode);
    setMode(cmd.mode);
  };

  // Trace.moe Optical Search handler
  const handleTraceSearch = async (imageInput: string) => {
    if (!imageInput.trim()) return;
    setTraceStatus('Analyzing frame with Trace.moe optical scene recognition...');
    try {
      const res = await fetch(`https://api.trace.moe/search?url=${encodeURIComponent(imageInput)}`);
      const data = await res.json();
      if (data && data.result && data.result.length > 0) {
        const top = data.result[0];
        const sim = (top.similarity * 100).toFixed(1) + '%';
        const fromSec = Math.round(top.from);
        
        let foundTitle = `AniList #${top.anilist}`;
        try {
          const aRes = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `query ($id: Int) { Media(id: $id, type: ANIME) { title { romaji english } } }`,
              variables: { id: top.anilist },
            }),
          });
          const aData = await aRes.json();
          foundTitle = aData?.data?.Media?.title?.english || aData?.data?.Media?.title?.romaji || foundTitle;
        } catch {}

        setTraceMatch({
          title: foundTitle,
          episode: top.episode || 1,
          timeSec: fromSec,
          sim,
          thumb: top.image || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
        });
        setTraceStatus(`Optical recognition complete: ${sim} match for "${foundTitle}"!`);
      } else {
        setTraceStatus('Trace.moe: No high-confidence scene match found.');
      }
    } catch (err: any) {
      setTraceStatus(`Trace.moe query error: ${err.message}`);
    }
  };

  const filteredCatalog = catalog.filter((item) => {
    const matchesSource = sourceFilter === 'ALL' || item.source === sourceFilter;
    const matchesGenre = filter === 'ALL' || item.genreTag === filter;
    return matchesSource && matchesGenre;
  });

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8">
      {/* 2.5D Spatial Hero Banner */}
      <SpatialHeroStage
        title={activeAnime.title}
        synopsis={activeAnime.synopsis}
        episodeCount={activeAnime.episodes}
        bannerImage={activeAnime.bannerImage}
        score={activeAnime.score}
        studio={activeAnime.studio}
        genreTag={activeAnime.genreTag}
        onWatchNow={() => {
          const el = document.getElementById('cinemaPlayerSection');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenCommandBar={() => setCmdOpen(true)}
      />

      {/* Cinema Stage: Ambilight HLS Player + Episode Matrix */}
      <section id="cinemaPlayerSection" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <AmbilightPlayer
            manifestUrl={streamUrl}
            title={activeAnime.title}
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
        </div>

        {/* Right 4 Cols: Episode Matrix Selector */}
        <div className="space-y-4 lg:col-span-4">
          <div className="hud-glass rounded-2xl p-5 border border-white/10 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-bold text-white">EPISODE MATRIX</h2>
                <p className="font-mono text-[11px] text-cyan-300">
                  {activeAnime.title} ({activeAnime.episodes} EPS)
                </p>
              </div>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                L2 CACHED
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {Array.from({ length: Math.min(activeAnime.episodes || 24, 24) }, (_, i) => i + 1).map((ep) => {
                const isActive = ep === episode;
                return (
                  <button
                    key={ep}
                    type="button"
                    onClick={() => setEpisode(ep)}
                    className={`rounded-xl py-2 font-mono text-xs transition ${
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

      {/* Trace.moe AI Optical Scene Recognition Console (public-apis#anime) */}
      <section className="hud-glass rounded-3xl p-6 border border-white/10 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-xs font-bold text-cyan-400">TRACE.MOE AI OPTICAL SCENE SEARCH</span>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-300">public-apis#anime</span>
            </div>
            <h2 className="font-display text-lg font-bold text-white mt-1">Optical Frame Identifier &amp; Instant Seek</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">DEMO FRAMES:</span>
            <button
              type="button"
              onClick={() => {
                const sample = 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg';
                setTraceUrl(sample);
                handleTraceSearch(sample);
              }}
              className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-300 ring-1 ring-white/10 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
            >
              Titan Breach (Ep 1)
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg';
                setTraceUrl(sample);
                handleTraceSearch(sample);
              }}
              className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-300 ring-1 ring-white/10 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
            >
              Hinokami (Ep 19)
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/130591-sHqKbxYwZqK8.jpg';
                setTraceUrl(sample);
                handleTraceSearch(sample);
              }}
              className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-300 ring-1 ring-white/10 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
            >
              Sandevistan (Ep 2)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
          <div className="space-y-2 lg:col-span-7">
            <div className="flex gap-2">
              <input
                type="text"
                value={traceUrl}
                onChange={(e) => setTraceUrl(e.target.value)}
                placeholder="Paste anime screenshot image URL..."
                className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 font-mono text-xs text-white outline-none ring-1 ring-white/15 focus:ring-cyan-400"
              />
              <button
                type="button"
                onClick={() => handleTraceSearch(traceUrl)}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2.5 font-mono text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 hover:scale-105 transition"
              >
                DETECT SCENE
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-400">{traceStatus}</p>
          </div>

          <div className="lg:col-span-5">
            <div className="hud-glass-elevated flex items-center gap-4 rounded-2xl border border-cyan-400/30 p-3">
              <div className="relative aspect-video w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-900">
                <img src={traceMatch.thumb} alt="Preview" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
                  {traceMatch.sim}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="truncate font-display text-sm font-bold text-white">{traceMatch.title}</div>
                <div className="font-mono text-xs text-cyan-300">
                  Episode {traceMatch.episode} • {Math.floor(traceMatch.timeSec / 60)}m {traceMatch.timeSec % 60}s
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const matched =
                      catalog.find(
                        (a) =>
                          a.title.toLowerCase().includes(traceMatch.title.toLowerCase()) ||
                          traceMatch.title.toLowerCase().includes(a.title.toLowerCase())
                      ) || activeAnime;
                    handleSelectAnime(matched, traceMatch.episode);
                  }}
                  className="rounded-lg bg-cyan-400 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-950 hover:bg-cyan-300 transition"
                >
                  ▶ STREAM THIS MATCH
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seasonal Anime Catalog Bento Grid */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              FEDERATED ANIME CATALOG // ANILIST + KITSU + GHIBLI
            </h2>
            <p className="font-mono text-xs text-slate-400">
              Aggregated from public-apis/public-apis#anime with zero-reload WebGPU Anime4K streaming
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source Filters */}
            <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10 font-mono text-xs">
              {[
                { label: '🌟 ALL', val: 'ALL' },
                { label: '🌸 ANILIST', val: 'anilist' },
                { label: '🦊 KITSU', val: 'kitsu' },
                { label: '🍃 GHIBLI', val: 'ghibli' },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSourceFilter(val)}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    sourceFilter === val
                      ? 'bg-cyan-400 font-bold text-slate-950'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Genre Filters */}
            <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10 font-mono text-xs">
              {['ALL', 'SHONEN', 'DARK FANTASY', 'CYBERPUNK', 'ACTION'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilter(tag)}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    filter === tag
                      ? 'bg-cyan-400 font-bold text-slate-950'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCatalog.map((anime) => {
            const isSelected = anime.id === activeAnime.id;
            const sourceColor =
              anime.source === 'ghibli'
                ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/40'
                : anime.source === 'kitsu'
                ? 'bg-indigo-500/20 text-indigo-300 ring-indigo-400/40'
                : 'bg-cyan-500/20 text-cyan-300 ring-cyan-400/40';

            return (
              <div
                key={anime.id}
                onClick={() => handleSelectAnime(anime, 1)}
                className={`hud-glass group cursor-pointer overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 ${
                  isSelected ? 'border-cyan-400/60 ring-1 ring-cyan-400/40' : 'border-white/10'
                }`}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06070B] via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span className="rounded-md bg-slate-950/85 px-2.5 py-1 font-mono text-[10px] font-bold text-cyan-300 ring-1 ring-white/15">
                      {anime.genreTag}
                    </span>
                    {anime.source && (
                      <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase ring-1 ${sourceColor}`}>
                        {anime.source}
                      </span>
                    )}
                  </div>
                  <div className="absolute right-3 top-3 rounded-md bg-emerald-500/20 px-2 py-1 font-mono text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/40">
                    ★ {anime.score}%
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="font-mono text-[10px] text-cyan-300">
                      {anime.studio} • {anime.episodes} EPS
                    </div>
                    <h3 className="font-display text-lg font-bold text-white">{anime.title}</h3>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <p className="line-clamp-2 text-xs text-slate-300">{anime.synopsis}</p>
                  <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                    <span className="text-cyan-400 truncate max-w-[130px]">id: {anime.slug}</span>
                    <span className="rounded-lg bg-cyan-400/15 px-3 py-1 font-bold text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-slate-950">
                      STREAM NOW →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Command-K Neural Omni-Bar */}
      <NeuralOmniBar
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onExecute={handleExecuteCommand}
      />
    </main>
  );
}
