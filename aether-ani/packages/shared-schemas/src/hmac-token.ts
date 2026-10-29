import crypto from 'crypto';

export interface ProxyPayload {
  targetUrl: string;
  referer: string;
  origin: string;
  exp: number;
}

/**
 * Signs and verifies stateless Edge HLS Proxy tokens using HMAC-SHA256
 * Prevents unauthorized hotlinking and open-proxy abuse.
 */
export function signProxyPayload(payload: ProxyPayload, secretKey: string): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyProxyToken(token: string, secretKey: string): ProxyPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(encoded)
    .digest('base64url');

  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as ProxyPayload;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}
