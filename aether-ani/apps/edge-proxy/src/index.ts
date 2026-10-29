/**
 * Stateless Edge Worker HLS Manifest & Multi-Audio Track Rewriter Proxy.
 * Solves browser CORS blocks, Referer enforcement, and separate HLS audio renditions
 * (pystardust/ani-cli commit 0301d67 / PR #1967).
 */

export interface Env {
  ALLOWED_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    const referer = url.searchParams.get('referer') ?? '';

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing target stream URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env.ALLOWED_ORIGIN) },
      });
    }

    const upstreamHeaders = new Headers();
    if (referer) {
      upstreamHeaders.set('Referer', referer);
      try {
        upstreamHeaders.set('Origin', new URL(referer).origin);
      } catch {
        // Ignore malformed referer origin
      }
    }
    upstreamHeaders.set(
      'User-Agent',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    );

    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      upstreamHeaders.set('Range', rangeHeader);
    }

    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: upstreamHeaders,
    });

    const contentType = upstreamRes.headers.get('Content-Type') ?? '';
    const isManifest =
      targetUrl.includes('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('vnd.apple.mpegurl');

    if (isManifest) {
      const rawManifest = await upstreamRes.text();
      const rewritten = rewriteHlsManifest(rawManifest, targetUrl, url.origin, referer);
      return new Response(rewritten, {
        status: upstreamRes.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'public, max-age=120',
          ...corsHeaders(env.ALLOWED_ORIGIN),
        },
      });
    }

    // Stream binary video/audio segments (.ts, .m4s, .aac, .vtt) directly with zero buffering
    const responseHeaders = new Headers(corsHeaders(env.ALLOWED_ORIGIN));
    responseHeaders.set('Content-Type', contentType || 'video/mp2t');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');
    const contentRange = upstreamRes.headers.get('Content-Range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  },
};

function rewriteHlsManifest(
  manifestText: string,
  baseManifestUrl: string,
  proxyOrigin: string,
  referer: string
): string {
  const baseUrl = new URL(baseManifestUrl);

  const toProxyUrl = (rawUri: string): string => {
    const resolved = new URL(rawUri.trim(), baseUrl).toString();
    return `${proxyOrigin}/?url=${encodeURIComponent(resolved)}&referer=${encodeURIComponent(referer)}`;
  };

  return manifestText
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Rewrite URI="..." inside #EXT-X-MEDIA:TYPE=AUDIO (#1967) and #EXT-X-KEY
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${toProxyUrl(uri)}"`);
      }

      // Rewrite variant playlist or segment line
      return toProxyUrl(trimmed);
    })
    .join('\n');
}

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
  };
}
