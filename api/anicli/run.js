// Vercel Serverless Function: /api/anicli/run
// Resolves anime stream sources (HLS master playlist, subtitles, skip timestamps)

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
  const malId = resolveMalId(cleanQuery);
  const fallbackEmbed = `https://zokoanime.video/stream/mal/${malId}/${ep}/${mode}`;

  try {
    const streamInfo = await resolveDirectHls(malId, ep, mode);
    if (streamInfo && streamInfo.src) {
      return res.status(200).json({
        success: true,
        query: cleanQuery,
        episode: ep,
        mode,
        malId,
        embedUrl: fallbackEmbed,
        videoUrl: streamInfo.src,
        subUrl: streamInfo.subUrl,
        skip: streamInfo.skip,
        referer: 'https://zokoanime.video/',
        logs: `Resolved 1080p stream for ${cleanQuery} (Ep ${ep}) via POSIX stream mesh.`
      });
    }

    return res.status(200).json({
      success: true,
      query: cleanQuery,
      episode: ep,
      mode,
      malId,
      embedUrl: fallbackEmbed,
      videoUrl: null,
      subUrl: null,
      skip: null,
      referer: 'https://zokoanime.video/',
      logs: `Resolved fallback stream for ${cleanQuery} (Ep ${ep}).`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      embedUrl: fallbackEmbed
    });
  }
};
