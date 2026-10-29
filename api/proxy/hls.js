// Vercel Serverless Function: /api/proxy/hls
// Proxies HLS video streams, m3u8 playlists, and TS segments with CORS headers

const http = require('http');
const https = require('https');
const { URL } = require('url');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query || {};
  const targetUrl = query.url;
  const referer = query.referer || 'https://zokoanime.video/';

  if (!targetUrl) {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    const u = new URL(targetUrl);
    const client = u.protocol === 'https:' ? https : http;
    const headers = {
      'Referer': referer,
      'Origin': new URL(referer).origin,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    client.get(targetUrl, { headers }, (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || '';
      const isM3u8 = targetUrl.includes('.m3u8') || contentType.includes('mpegurl');

      if (isM3u8) {
        let body = '';
        proxyRes.on('data', chunk => { body += chunk; });
        proxyRes.on('end', () => {
          const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
          const rewritten = body.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const fullChunkUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
              return `/api/proxy/hls?url=${encodeURIComponent(fullChunkUrl)}&referer=${encodeURIComponent(referer)}`;
            }
            return line;
          }).join('\n');

          res.writeHead(proxyRes.statusCode || 200, {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
          });
          res.end(rewritten);
        });
      } else {
        res.writeHead(proxyRes.statusCode || 200, {
          'Content-Type': contentType || 'video/mp2t',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600'
        });
        proxyRes.pipe(res);
      }
    }).on('error', (err) => {
      res.status(502).send('Proxy upstream error: ' + err.message);
    });
  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message);
  }
};
