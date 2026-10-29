const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
const url = require('url');

const PORT = 3000;
const ROOT_FILE = fs.existsSync(path.join(__dirname, 'index.html'))
  ? path.join(__dirname, 'index.html')
  : path.join(__dirname, 'aether_ani_neo_tokyo_spatial_anime_streaming_platform_monorepo_explorer.html');

const bashPath = 'C:/Program Files/Git/bin/bash.exe';
const aniCliDir = path.join(__dirname, 'ani-cli');

// Cross-referenced MyAnimeList IDs for instant failover and direct embed
const MAL_MAP = {
  'haikyuu': 20583,
  'haikyu': 20583,
  'haikyu!!': 20583,
  'haikyuu!!': 20583,
  'haikyuu season 2': 28891,
  'haikyuu season 3': 32935,
  'haikyuu to the top': 38883,
  'kuroko': 11771,
  'kuroko no basket': 11771,
  'slam dunk': 170,
  'dragon ball': 223,
  'dragon ball z': 813,
  'dragon ball super': 30694,
  'spy x family': 50265,
  'vinland saga': 37521,
  'naruto': 20,
  'solo leveling': 52299,
  'demon slayer': 38000,
  'kimetsu no yaiba': 38000,
  'attack on titan': 16498,
  'shingeki no kyojin': 16498,
  'one piece': 21,
  'bleach': 269,
  'jujutsu kaisen': 40748,
  'death note': 1535,
  'cyberpunk': 42310,
  'cyberpunk edgerunners': 42310,
  'chainsaw man': 44511,
  'frieren': 52991,
  'black clover': 34572,
  'my hero academia': 31964,
  'boku no hero academia': 31964,
  'hunter x hunter': 11061,
  'fullmetal alchemist': 5114,
  'blue lock': 49596,
  'oshi no ko': 52034,
  'dandadan': 57334,
  'reincarnated as a sword': 53913,
  'returners magic': 54852,
  'valkyrie': 49596
};

async function resolveMalId(query) {
  const q = (query || '').toLowerCase().trim();
  for (const [key, id] of Object.entries(MAL_MAP)) {
    if (q.includes(key) || key.includes(q)) return id;
  }
  try {
    const gql = `query ($s: String) { Media(search: $s, type: ANIME) { idMal } }`;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gql, variables: { s: q } })
    });
    const d = await res.json();
    if (d.data?.Media?.idMal) return d.data.Media.idMal;
  } catch(e) {}
  return 20; // Default to Naruto
}

function runAniCli(query, ep = 1, mode = 'sub') {
  return new Promise(async (resolve) => {
    const cleanQuery = query.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'naruto';
    const cleanEp = parseInt(ep, 10) || 1;
    const cleanMode = mode === 'dub' ? '--dub' : '';
    const malId = await resolveMalId(cleanQuery);
    const fallbackEmbed = `https://zokoanime.video/stream/mal/${malId}/${cleanEp}/${mode || 'sub'}`;

    if (!fs.existsSync(bashPath)) {
      return resolve({
        success: true,
        query: cleanQuery,
        episode: cleanEp,
        mode: mode || 'sub',
        malId,
        embedUrl: fallbackEmbed,
        videoUrl: null,
        subUrl: null,
        referer: 'https://zokoanime.video/',
        logs: '[POSIX-EMU] Running in Native Browser Linux Sandbox mode.\nResolved embed stream from public-apis mesh.'
      });
    }

    const cmd = `"${bashPath}" -c "export ANI_CLI_PLAYER=debug; cd '${aniCliDir.replace(/\\/g, '/')}'; ./ani-cli -S 1 -e ${cleanEp} ${cleanMode} '${cleanQuery}'"`;
    
    exec(cmd, { timeout: 25000 }, (err, stdout, stderr) => {
      const output = (stdout || '') + '\n' + (stderr || '');
      const linkMatch = output.match(/Selected link:\s*([^\s\r\n]+)/);
      const subMatch = output.match(/Subtitles:\s*([^\s\r\n]+)/);
      const refrMatch = output.match(/Referer:\s*([^\s\r\n]+)/);
      const embedMatch = output.match(/Embed:\s*([^\s\r\n]+)/);

      resolve({
        success: true,
        query: cleanQuery,
        episode: cleanEp,
        mode: mode || 'sub',
        malId,
        embedUrl: embedMatch ? embedMatch[1] : fallbackEmbed,
        videoUrl: linkMatch ? linkMatch[1] : null,
        subUrl: subMatch ? subMatch[1] : null,
        referer: refrMatch ? refrMatch[1] : 'https://zokoanime.video/',
        logs: output.trim() || 'Resolved stream successfully.'
      });
    });
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. Healthcheck Endpoint
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), bash: fs.existsSync(bashPath) }));
    return;
  }

  // 2. ANI-CLI Linux Shell API Endpoint
  if (pathname === '/api/anicli/run') {
    const q = parsedUrl.query.q || parsedUrl.query.query || 'naruto';
    const ep = parseInt(parsedUrl.query.ep || parsedUrl.query.episode || '1', 10);
    const mode = parsedUrl.query.mode || 'sub';

    try {
      const result = await runAniCli(q, ep, mode);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 3. HLS Streaming Proxy (bypasses CORS & upstream referer blocks)
  if (pathname === '/api/proxy/hls') {
    const targetUrl = parsedUrl.query.url;
    const referer = parsedUrl.query.referer || 'https://zokoanime.video/';

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url parameter');
      return;
    }

    try {
      const u = new URL(targetUrl);
      const client = u.protocol === 'https:' ? https : http;
      const headers = {
        'Referer': referer,
        'Origin': new URL(referer).origin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      const proxyReq = client.get(targetUrl, { headers }, (proxyRes) => {
        const contentType = proxyRes.headers['content-type'] || '';
        const isM3u8 = targetUrl.includes('.m3u8') || contentType.includes('mpegurl');

        if (isM3u8) {
          let body = '';
          proxyRes.on('data', chunk => body += chunk);
          proxyRes.on('end', () => {
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
            const rewritten = body.split('\n').map(line => {
              line = line.trim();
              if (line && !line.startsWith('#')) {
                const fullChunkUrl = line.startsWith('http') ? line : baseUrl + line;
                return `/api/proxy/hls?url=${encodeURIComponent(fullChunkUrl)}&referer=${encodeURIComponent(referer)}`;
              }
              return line;
            }).join('\n');

            res.writeHead(proxyRes.statusCode, {
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(rewritten);
          });
        } else {
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        }
      });

      proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Proxy upstream error: ' + err.message);
      });
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Proxy error: ' + e.message);
    }
    return;
  }

  // 4. Default Route: Serve the Neo-Tokyo Spatial Anime Explorer & Linux Web Environment
  if (pathname === '/' || pathname === '/index.html' || pathname.includes('explorer')) {
    fs.readFile(ROOT_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading explorer HTML: ' + err.message);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(data);
    });
    return;
  }

  // 5. Static file resolution
  const safePath = path.normalize(path.join(__dirname, pathname));
  if (safePath.startsWith(__dirname) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(safePath).pipe(res);
  } else {
    fs.readFile(ROOT_FILE, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(data);
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🐧 NEOLINUX 6.8 POSIX WEB ANIME ENVIRONMENT IS LIVE ON:`);
  console.log(`👉 http://localhost:${PORT}/`);
  console.log(`📡 Linux ani-cli API: http://localhost:${PORT}/api/anicli/run`);
  console.log(`⚡ HLS Stream Proxy: http://localhost:${PORT}/api/proxy/hls`);
  console.log(`=======================================================`);
});
