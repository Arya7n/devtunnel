import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { TUNNEL_HTTP_PREFIX } from '@devtunnel/shared';
import type { NextFunction, Request, Response } from 'express';
import { TunnelManagerService, TunnelNotFoundError } from './tunnel-manager.service';

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

@Injectable()
export class TunnelIngressMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TunnelIngressMiddleware.name);

  constructor(private readonly manager: TunnelManagerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (!req.path.startsWith(`${TUNNEL_HTTP_PREFIX}/`)) {
      next();
      return;
    }

    void this.handle(req, res);
  }

  private async handle(req: Request, res: Response): Promise<void> {
    const remainder = req.path.slice(TUNNEL_HTTP_PREFIX.length + 1);
    const slash = remainder.indexOf('/');
    const subdomain = slash === -1 ? remainder : remainder.slice(0, slash);
    const forwardPath = slash === -1 ? '/' : remainder.slice(slash) || '/';
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

    if (!subdomain) {
      res.status(400).json({ error: 'Missing tunnel subdomain' });
      return;
    }

    try {
      const headers = this.pickHeaders(req.headers);
      const body = this.readBody(req);

      const response = await this.manager.forwardHttp(subdomain, {
        method: req.method,
        path: `${forwardPath}${query}`,
        headers,
        bodyBase64: body.length > 0 ? body.toString('base64') : undefined,
      });

      res.status(response.status);
      for (const [key, value] of Object.entries(response.headers)) {
        if (HOP_BY_HOP.has(key.toLowerCase())) continue;
        res.setHeader(key, value);
      }

      if (response.bodyBase64) {
        res.send(Buffer.from(response.bodyBase64, 'base64'));
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof TunnelNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      this.logger.error(
        `Forward failed for ${subdomain}: ${error instanceof Error ? error.message : String(error)}`,
      );
      res.status(502).json({
        error: 'Bad gateway',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private pickHeaders(headers: Request['headers']): Record<string, string | string[]> {
    const out: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value === undefined) continue;
      if (HOP_BY_HOP.has(key.toLowerCase())) continue;
      out[key] = value;
    }
    return out;
  }

  private readBody(req: Request): Buffer {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (raw && Buffer.isBuffer(raw)) return raw;

    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      return Buffer.from(JSON.stringify(req.body));
    }
    return Buffer.alloc(0);
  }
}
