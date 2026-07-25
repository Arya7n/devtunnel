import type { HttpRequestPayload, HttpResponsePayload } from '@devtunnel/protocol';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

export async function proxyToLocalhost(
  localPort: number,
  request: HttpRequestPayload,
): Promise<HttpResponsePayload> {
  const url = `http://127.0.0.1:${localPort}${request.path}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.bodyBase64 && request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = Buffer.from(request.bodyBase64, 'base64');
  }

  const response = await fetch(url, init);
  const responseHeaders: Record<string, string | string[]> = {};
  response.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    responseHeaders[key] = value;
  });

  const body = Buffer.from(await response.arrayBuffer());

  return {
    requestId: request.requestId,
    status: response.status,
    headers: responseHeaders,
    bodyBase64: body.length > 0 ? body.toString('base64') : undefined,
  };
}
