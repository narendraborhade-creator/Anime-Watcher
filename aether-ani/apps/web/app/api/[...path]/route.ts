import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Route Handler proxying requests to the internal stream-api service
 * via Vercel service binding (STREAM_API_URL).
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToStreamApi(req, await context.params);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToStreamApi(req, await context.params);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToStreamApi(req, await context.params);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToStreamApi(req, await context.params);
}

async function proxyToStreamApi(req: NextRequest, { path }: { path: string[] }) {
  const streamApiBase = process.env.STREAM_API_URL || 'http://localhost:4000';
  const pathSegment = (path || []).join('/');
  const search = req.nextUrl.search;
  const targetUrl = new URL(`/api/${pathSegment}${search}`, streamApiBase);

  try {
    const headers = new Headers(req.headers);
    // Remove host header to avoid upstream Host mismatch
    headers.delete('host');

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = await req.blob();
    }

    const upstreamRes = await fetch(targetUrl.toString(), fetchOptions);
    const body = await upstreamRes.blob();

    return new NextResponse(body, {
      status: upstreamRes.status,
      headers: {
        'content-type': upstreamRes.headers.get('content-type') || 'application/json',
        'access-control-allow-origin': '*',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Stream API proxy error',
        message: err.message,
        target: targetUrl.toString(),
      },
      { status: 502 }
    );
  }
}
