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
  socket: WebSocket;
  subdomain: string;
  method: string;
  path: string;
  startedAt: number;
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
    const durationMs = Date.now() - pending.startedAt;
    this.logger.log(
      `[${payload.requestId}] ${pending.method} ${pending.subdomain}${pending.path} -> ${payload.status} (${durationMs}ms)`,
    );
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
        this.logger.warn(
          `[${requestId}] ${input.method} ${subdomain}${input.path} timed out after ${HTTP_FORWARD_TIMEOUT_MS}ms`,
        );
        reject(new TunnelForwardTimeoutError(requestId, subdomain, input.method, input.path));
      }, HTTP_FORWARD_TIMEOUT_MS);

      this.pending.set(requestId, {
        resolve,
        reject,
        timer,
        socket: tunnel.socket,
        subdomain,
        method: input.method,
        path: input.path,
        startedAt: Date.now(),
      });

      try {
        this.logger.log(`[${requestId}] Forwarding ${input.method} ${subdomain}${input.path}`);
        this.send(tunnel.socket, envelope);
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  rejectPendingForSocket(socket: WebSocket, reason: string): void {
    for (const [requestId, pending] of this.pending) {
      if (pending.socket !== socket) continue;
      clearTimeout(pending.timer);
      this.pending.delete(requestId);
      this.logger.warn(
        `[${requestId}] ${pending.method} ${pending.subdomain}${pending.path} aborted: ${reason}`,
      );
      pending.reject(
        new TunnelDisconnectedError(requestId, pending.subdomain, pending.method, pending.path, reason),
      );
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

export class TunnelForwardTimeoutError extends Error {
  constructor(
    public readonly requestId: string,
    public readonly subdomain: string,
    public readonly method: string,
    public readonly path: string,
  ) {
    super(`Tunnel response timed out after ${HTTP_FORWARD_TIMEOUT_MS}ms`);
    this.name = 'TunnelForwardTimeoutError';
  }
}

export class TunnelDisconnectedError extends Error {
  constructor(
    public readonly requestId: string,
    public readonly subdomain: string,
    public readonly method: string,
    public readonly path: string,
    reason: string,
  ) {
    super(reason);
    this.name = 'TunnelDisconnectedError';
  }
}
