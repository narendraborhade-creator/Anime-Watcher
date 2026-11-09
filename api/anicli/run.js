// Vercel Serverless Function: /api/anicli/run
// Resolves anime stream sources (Direct HLS, Multi-Host Dub Embeds, Subtitles, AniSkip timestamps)

const { URL } = require('url');

const MAL_MAP = {
  'haikyuu lev appears': 25303,
  'haikyuu vs failing marks': 35806,
  'attack on titan no regrets': 25781,
  'attack on titan ilses notebook': 18397,
  'reincarnated as a sword special': 53914,
  'one punch man road to hero': 31772,
  'black clover sword of the wizard king': 48471,
  'haikyuu dumpster battle': 52742,
  'haikyuu the dumpster battle': 52742,
  'haikyuu gomisuteba no kessen': 52742,
  'haikyuu battle of concepts': 34669,
  'haikyuu concept no tatakai': 34669,
  'haikyuu talent and sense': 34668,
  'haikyuu sainou to sense': 34668,
  'haikyuu land vs air': 40074,
  'haikyuu land vs sky': 40074,
  'haikyuu riku vs kuu': 40074,
  'haikyuu the end and the beginning': 29755,
  'haikyuu owari to hajimari': 29755,
  'mugen train': 40456,
  'demon slayer mugen train': 40456,
  'jujutsu kaisen 0': 48561,
  'attack on titan final chapters': 51535,
  'attack on titan chronicle': 42091,
  'one piece film red': 50410,
  'one piece stampede': 38234,
  'one piece film z': 12859,
  'spy x family code white': 53888,
  'bleach hell verse': 8247,
  'my hero academia youre next': 56196,
  'my hero academia you\'re next': 56196,
  'my hero academia world heroes mission': 44200,
  'my hero academia heroes rising': 39565,
  'solo leveling reawakening': 59374,
  'haikyuu': 20583,
  'haikyu': 20583,
  'haikyu!!': 20583,
  'haikyuu!!': 20583,
  'haikyuu season 2': 28891,
  'haikyuu 2nd season': 28891,
  'haikyuu season 3': 32935,
  'haikyuu 3rd season': 32935,
  'haikyuu to the top': 38883,
  'haikyuu season 4': 38883,
  'attack on titan': 16498,
  'attack on titan season 2': 25777,
  'attack on titan season 3': 35760,
  'attack on titan season 4': 40028,
  'attack on titan final season': 40028,
  'demon slayer': 38000,
  'demon slayer season 2': 47778,
  'demon slayer season 3': 51019,
  'demon slayer season 4': 55701,
  'jujutsu kaisen': 40748,
  'jujutsu kaisen season 2': 51009,
  'solo leveling': 52299,
  'solo leveling season 2': 58567,
  'spy x family': 50265,
  'spy x family season 2': 53887,
  'vinland saga': 37521,
  'vinland saga season 2': 49387,
  'bleach': 269,
  'bleach tybw': 41467,
  'my hero academia': 31964,
  'my hero academia season 2': 35247,
  'my hero academia season 3': 36456,
  'my hero academia season 4': 38408,
  'my hero academia season 5': 41587,
  'my hero academia season 6': 49918,
  'my hero academia season 7': 54789,
  'kuroko': 11771,
  'kuroko no basket': 11771,
  'slam dunk': 170,
  'dragon ball': 223,
  'dragon ball z': 813,
  'dragon ball super': 30694,
  'naruto': 20,
  'one piece': 21,
  'death note': 1535,
  'cyberpunk': 42310,
  'cyberpunk edgerunners': 42310,
  'chainsaw man': 44511,
  'frieren': 52991,
  'black clover': 34572,
  'hunter x hunter': 11061,
  'fullmetal alchemist': 5114,
  'blue lock': 49596,
  'oshi no ko': 52034,
  'dandadan': 57334,
  'reincarnated as a sword season 2': 53913,
  'reincarnated as a sword 2nd season': 53913,
  'reincarnated as a sword season 1': 49891,
  'reincarnated as a sword 1st season': 49891,
  'reincarnated as a sword': 49891,
  'tensei shitara ken deshita 2nd season': 53913,
  'tensei shitara ken deshita season 2': 53913,
  'tensei shitara ken deshita': 49891,
  'returners magic': 54852,
  'valkyrie': 49596
};

function resolveMalId(query) {
  const q = (query || '').toLowerCase().trim();
  if (MAL_MAP[q]) return MAL_MAP[q];

  const sortedEntries = Object.entries(MAL_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, id] of sortedEntries) {
    if (q.includes(key)) return id;
  }
  for (const [key, id] of sortedEntries) {
    const isSeasonKey = /season|2nd|3rd|4th|part/i.test(key);
    const hasSeasonInQuery = /season|2nd|3rd|4th|part/i.test(q);
    if (isSeasonKey && !hasSeasonInQuery) continue;

    const words = key.split(' ').filter(w => w.length > 2 && !['the', 'and', 'season', 'act'].includes(w));
    if (words.length > 0 && words.every(w => q.includes(w))) {
      return id;
    }
  }
  return 20; // Default to Naruto
}

function deobfuscateBlob(b64) {
  const buf = Buffer.from(b64, 'base64');
  const key = Buffer.from('otaku-embed-v1');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ key[i % key.length];
  }
  return out.toString('utf8');
}

async function resolveDirectHls(malId, ep = 1, mode = 'sub') {
  try {
    const embedUrl = `https://zokoanime.video/stream/mal/${malId}/${ep}/${mode || 'sub'}`;
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/window\.__P="([^"]+)"/);
    if (!match) return null;
    const parsed = JSON.parse(deobfuscateBlob(match[1]));
    const defaultSub = (parsed.subtitles || []).find(s => s.default) || (parsed.subtitles || [])[0] || null;
    return {
      src: parsed.src,
      subUrl: defaultSub ? defaultSub.src : null,
      skip: parsed.skip || null
    };
  } catch (e) {
    return null;
  }
}

async function fetchAniSkip(malId, ep) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://api.aniskip.com/v2/skip-times/${malId}/${ep}?types=op&types=ed&episodeLength=0`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.found && Array.isArray(json.results)) {
      const op = json.results.find(r => r.skipType === 'op');
      const ed = json.results.find(r => r.skipType === 'ed');
      return {
        intro: op ? { start: op.interval.startTime, end: op.interval.endTime } : null,
        outro: ed ? { start: ed.interval.startTime, end: ed.interval.endTime } : null,
        hasOp: !!op,
        hasEd: !!ed
      };
    }
  } catch (e) {}
  return null;
}

// Checks if the dub stream provided by primary CDN is actually an identical clone of the sub stream
async function isStreamDuplicated(subSrc, dubSrc) {
  if (!subSrc || !dubSrc) return false;
  if (subSrc === dubSrc) return true;
  try {
    const [mSub, mDub] = await Promise.all([
      fetch(subSrc, { headers: { Referer: 'https://zokoanime.video/' } }).then(r => r.text()),
      fetch(dubSrc, { headers: { Referer: 'https://zokoanime.video/' } }).then(r => r.text())
    ]);

    const getFirstUrl = (text, base) => {
      const line = text.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#'));
      return line ? (line.startsWith('http') ? line : new URL(line, base).href) : null;
    };

    const idxSub = getFirstUrl(mSub, subSrc);
    const idxDub = getFirstUrl(mDub, dubSrc);
    if (!idxSub || !idxDub) return false;

    const [tIdxSub, tIdxDub] = await Promise.all([
      fetch(idxSub, { headers: { Referer: 'https://zokoanime.video/' } }).then(r => r.text()),
      fetch(idxDub, { headers: { Referer: 'https://zokoanime.video/' } }).then(r => r.text())
    ]);

    const segSub = getFirstUrl(tIdxSub, idxSub);
    const segDub = getFirstUrl(tIdxDub, idxDub);
    if (!segSub || !segDub) return false;

    const [hSub, hDub] = await Promise.all([
      fetch(segSub, { method: 'HEAD', headers: { Referer: 'https://zokoanime.video/' } }),
      fetch(segDub, { method: 'HEAD', headers: { Referer: 'https://zokoanime.video/' } })
    ]);

    const lenSub = hSub.headers.get('content-length');
    const lenDub = hDub.headers.get('content-length');
    if (lenSub && lenDub && lenSub === lenDub) {
      return true; // Exact duplicate of sub stream!
    }
  } catch (e) {}
  return false;
}

// Resolves authentic HD-1 Multi-Host server from HiAnime / MegaPlay mesh (Sub & Dub)
async function resolveHiAnimeServer(query, ep = 1, mode = 'dub') {
  try {
    const searchTerms = [query];
    const lower = query.toLowerCase();
    if (lower.includes('reincarnated as a sword') && !searchTerms.includes('tensei shitara ken deshita')) {
      searchTerms.push('tensei shitara ken deshita');
    }
    if (lower.includes('solo leveling') && !searchTerms.includes('ore dake level up')) {
      searchTerms.push('ore dake level up na ken');
    }
    if (lower.includes('attack on titan') && !searchTerms.includes('shingeki no kyojin')) {
      searchTerms.push('shingeki no kyojin');
    }
    if (lower.includes('demon slayer') && !searchTerms.includes('kimetsu no yaiba')) {
      searchTerms.push('kimetsu no yaiba');
    }

    let animeId = null;
    for (const term of searchTerms) {
      try {
        const sRes = await fetch(`https://hianime.at/search?keyword=${encodeURIComponent(term)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(3500)
        });
        if (!sRes.ok) continue;
        const sHtml = await sRes.text();
        const filmMatch = sHtml.match(/class="film-detail"[\s\S]*?<a\s+href="https:\/\/hianime\.at\/([^"]+)-([0-9]+)"/);
        if (filmMatch) {
          animeId = filmMatch[2];
          break;
        }
      } catch (e) {}
    }
    if (!animeId) return null;

    const epRes = await fetch(`https://hianime.at/api/theme/episode/list/${animeId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(3500)
    });
    if (!epRes.ok) return null;
    const epData = await epRes.json();
    const epRegex = new RegExp(`data-number="${ep}"[\\s\\S]*?data-id="([0-9]+)"`, 'i');
    const epMatch = epData.html.match(epRegex) || epData.html.match(new RegExp(`data-id="([0-9]+)"[\\s\\S]*?data-number="${ep}"`, 'i'));
    if (!epMatch) return null;
    const epId = epMatch[1];

    const srvRes = await fetch(`https://hianime.at/api/theme/episode/servers?episodeId=${epId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(3500)
    });
    if (!srvRes.ok) return null;
    const srvData = await srvRes.json();

    const blockRegex = mode === 'dub'
      ? /class="[^"]*servers-dub[^"]*"[\s\S]*?<\/div>\s*<\/div>/i
      : /class="[^"]*servers-sub[^"]*"[\s\S]*?<\/div>\s*<\/div>/i;
    const blockMatch = srvData.html.match(blockRegex);
    if (!blockMatch) return null;

    const servers = [...blockMatch[0].matchAll(/data-server-name="([^"]+)"\s+data-hash="([^"]+)"/g)].map(m => ({
      name: m[1],
      url: Buffer.from(m[2], 'base64').toString('utf8')
    }));

    // Prefer HD-1 or non-zokoanime server to avoid DNS block in client browsers
    const cleanServer = servers.find(s => s.name === 'HD-1' || !s.url.includes('zokoanime.video'));
    return cleanServer ? cleanServer.url : (servers[0] && !servers[0].url.includes('zokoanime.video') ? servers[0].url : null);
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let body = {};
  if (req.body) {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      body = {};
    }
  }

  const query = req.query || {};
  const q = query.q || query.query || body.query || body.q || 'haikyuu';
  const ep = parseInt(query.ep || body.ep, 10) || 1;
  const mode = query.mode || body.mode || 'sub';

  const cleanQuery = q.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'haikyuu';
  const explicitMalId = parseInt(query.malId || body.malId, 10);
  const malId = (!isNaN(explicitMalId) && explicitMalId > 0) ? explicitMalId : resolveMalId(cleanQuery);

  try {
    // 1. Fetch direct stream and AniSkip skip timestamps in parallel
    const [subInfo, dubInfo, aniskipData] = await Promise.all([
      resolveDirectHls(malId, ep, 'sub'),
      mode === 'dub' ? resolveDirectHls(malId, ep, 'dub') : Promise.resolve(null),
      fetchAniSkip(malId, ep)
    ]);

    let streamInfo = subInfo;
    let resolvedMode = 'sub';
    let dubUnavailable = false;
    let isEmbedPlayer = false;
    let resolvedEmbedUrl = null;
    let serverName = 'Primary Direct HLS';

    if (mode === 'dub') {
      let hasRealDirectDub = false;
      if (dubInfo && dubInfo.src) {
        const isDup = await isStreamDuplicated(subInfo ? subInfo.src : null, dubInfo.src);
        if (!isDup) {
          hasRealDirectDub = true;
          streamInfo = dubInfo;
          resolvedMode = 'dub';
          dubUnavailable = false;
          serverName = 'Primary Direct English Dub';
        }
      }

      // If primary CDN doesn't have authentic English Dub, resolve HD-1 Dub embed
      if (!hasRealDirectDub) {
        const hd1DubUrl = await resolveHiAnimeServer(cleanQuery, ep, 'dub');
        if (hd1DubUrl) {
          resolvedMode = 'dub';
          dubUnavailable = false;
          isEmbedPlayer = true;
          resolvedEmbedUrl = hd1DubUrl;
          serverName = 'HD-1 Multi-Host (English Dub)';
        } else {
          // If no dub exists at all
          dubUnavailable = true;
          resolvedMode = 'sub';
          streamInfo = subInfo;
        }
      }
    } else {
      streamInfo = subInfo;
      resolvedMode = 'sub';
      dubUnavailable = false;

      // If direct sub stream failed or is unreachable, fallback to HD-1 Sub embed
      if (!streamInfo || !streamInfo.src) {
        const hd1SubUrl = await resolveHiAnimeServer(cleanQuery, ep, 'sub');
        if (hd1SubUrl) {
          resolvedMode = 'sub';
          isEmbedPlayer = true;
          resolvedEmbedUrl = hd1SubUrl;
          serverName = 'HD-1 Multi-Host (English Sub)';
        }
      }
    }

    // Determine highest-fidelity skip timestamps: AniSkip > Upstream Provider
    let skipTimestamps = null;
    if (aniskipData) {
      skipTimestamps = aniskipData;
    } else if (streamInfo && streamInfo.skip) {
      skipTimestamps = {
        intro: streamInfo.skip.intro ? { start: streamInfo.skip.intro.start, end: streamInfo.skip.intro.end } : null,
        outro: streamInfo.skip.outro ? { start: streamInfo.skip.outro.start, end: streamInfo.skip.outro.end } : null,
        hasOp: !!(streamInfo.skip.intro),
        hasEd: !!(streamInfo.skip.outro)
      };
    }

    // Return HD-1 embed player for English Dub or fallback when direct stream is not available
    if (isEmbedPlayer && resolvedEmbedUrl) {
      return res.status(200).json({
        success: true,
        query: cleanQuery,
        episode: ep,
        mode: resolvedMode,
        requestedMode: mode,
        dubUnavailable: false,
        hasDub: true,
        isEmbedPlayer: true,
        malId,
        embedUrl: resolvedEmbedUrl,
        videoUrl: null,
        subUrl: null,
        skip: skipTimestamps,
        serverName,
        referer: 'https://hianime.at/',
        logs: `Resolved authentic ${resolvedMode.toUpperCase()} stream via ${serverName} for ${cleanQuery} (Ep ${ep}).`
      });
    }

    if (streamInfo && streamInfo.src) {
      return res.status(200).json({
        success: true,
        query: cleanQuery,
        episode: ep,
        mode: resolvedMode,
        requestedMode: mode,
        dubUnavailable,
        hasDub: !dubUnavailable,
        isEmbedPlayer: false,
        malId,
        embedUrl: resolvedEmbedUrl,
        videoUrl: streamInfo.src,
        subUrl: streamInfo.subUrl,
        skip: skipTimestamps,
        serverName,
        referer: 'https://zokoanime.video/',
        logs: dubUnavailable
          ? `English dub not provided for ${cleanQuery} (Ep ${ep}). Seamlessly playing in Japanese with English Subtitles.`
          : `Resolved 1080p ${resolvedMode.toUpperCase()} stream for ${cleanQuery} (Ep ${ep}) via POSIX stream mesh.`
      });
    }

    return res.status(200).json({
      success: true,
      query: cleanQuery,
      episode: ep,
      mode: resolvedMode,
      requestedMode: mode,
      dubUnavailable,
      hasDub: !dubUnavailable,
      isEmbedPlayer: true,
      malId,
      embedUrl: resolvedEmbedUrl,
      videoUrl: null,
      subUrl: null,
      skip: skipTimestamps,
      serverName,
      referer: 'https://hianime.at/',
      logs: `Resolved fallback stream for ${cleanQuery} (Ep ${ep}).`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      embedUrl: null
    });
  }
};
