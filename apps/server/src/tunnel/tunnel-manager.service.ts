import { Injectable, Logger } from '@nestjs/common';
import {
  createEnvelope,
  generateId,
  serializeEnvelope,
  type HttpRequestPayload,
  type HttpResponsePayload,
} from '@devtunnel/protocol';
import { HTTP_FORWARD_TIMEOUT_MS } from '@devtunnel/shared';
import type WebSocket from 'ws';
import { TunnelRegistryService } from './tunnel-registry.service';

interface PendingRequest {
  resolve: (response: HttpResponsePayload) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

@Injectable()
export class TunnelManagerService {
  private readonly logger = new Logger(TunnelManagerService.name);
  private readonly pending = new Map<string, PendingRequest>();

  constructor(private readonly registry: TunnelRegistryService) {}

  resolveHttpResponse(payload: HttpResponsePayload): void {
    const pending = this.pending.get(payload.requestId);
    if (!pending) {
      this.logger.warn(`No pending request for ${payload.requestId}`);
      return;
    }
    clearTimeout(pending.timer);
    this.pending.delete(payload.requestId);
    pending.resolve(payload);
  }

  async forwardHttp(
    subdomain: string,
    input: Omit<HttpRequestPayload, 'requestId'>,
  ): Promise<HttpResponsePayload> {
    const tunnel = this.registry.getBySubdomain(subdomain);
    if (!tunnel) {
      throw new TunnelNotFoundError(subdomain);
    }

    const requestId = generateId();
    const payload: HttpRequestPayload = { ...input, requestId };
    const envelope = createEnvelope('http_request', payload);

    return new Promise<HttpResponsePayload>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Tunnel response timed out after ${HTTP_FORWARD_TIMEOUT_MS}ms`));
      }, HTTP_FORWARD_TIMEOUT_MS);

      this.pending.set(requestId, { resolve, reject, timer });

      try {
        this.send(tunnel.socket, envelope);
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  rejectPendingForSocket(socket: WebSocket, reason: string): void {
    const tunnel = this.registry.getBySocket(socket);
    if (!tunnel) return;

    for (const [requestId, pending] of this.pending) {
      // Best-effort: reject all pending when any socket drops (MVP single-tunnel-per-connection)
      clearTimeout(pending.timer);
      this.pending.delete(requestId);
      pending.reject(new Error(reason));
    }
  }

  private send(socket: WebSocket, envelope: ReturnType<typeof createEnvelope>): void {
    if (socket.readyState !== socket.OPEN) {
      throw new Error('Tunnel socket is not open');
    }
    socket.send(serializeEnvelope(envelope));
  }
}

export class TunnelNotFoundError extends Error {
  constructor(subdomain: string) {
    super(`No active tunnel for subdomain "${subdomain}"`);
    this.name = 'TunnelNotFoundError';
  }
}
