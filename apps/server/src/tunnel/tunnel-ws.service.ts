import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  createEnvelope,
  generateId,
  parseEnvelope,
  serializeEnvelope,
  type HttpResponsePayload,
  type RegisterTunnelPayload,
} from '@devtunnel/protocol';
import { DEFAULT_WS_PATH, TUNNEL_HTTP_PREFIX } from '@devtunnel/shared';
import type { Server as HttpServer } from 'http';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { TunnelManagerService } from './tunnel-manager.service';
import { TunnelRegistryService } from './tunnel-registry.service';

@Injectable()
export class TunnelWsService implements OnModuleDestroy {
  private readonly logger = new Logger(TunnelWsService.name);
  private wss?: WebSocketServer;

  constructor(
    private readonly registry: TunnelRegistryService,
    private readonly manager: TunnelManagerService,
  ) {}

  attach(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: DEFAULT_WS_PATH });

    this.wss.on('connection', (socket, request) => {
      this.logger.log(`CLI connected from ${request.socket.remoteAddress ?? 'unknown'}`);
      socket.on('message', (raw) => this.onMessage(socket, raw));
      socket.on('close', () => this.onClose(socket));
      socket.on('error', (error) => {
        this.logger.warn(`Socket error: ${error.message}`);
      });
    });

    this.logger.log(`WebSocket tunnel endpoint ready at ${DEFAULT_WS_PATH}`);
  }

  onModuleDestroy(): void {
    this.wss?.close();
  }

  private onMessage(socket: WebSocket, raw: RawData): void {
    try {
      const envelope = parseEnvelope(raw as Buffer);
      switch (envelope.type) {
        case 'auth':
          // Auth is deferred to Phase 6 — accept all connections for local MVP
          this.send(socket, createEnvelope('auth_ok', {}, envelope.id));
          break;
        case 'register_tunnel':
          this.handleRegister(socket, envelope.payload as RegisterTunnelPayload, envelope.id);
          break;
        case 'http_response':
          this.manager.resolveHttpResponse(envelope.payload as HttpResponsePayload);
          break;
        case 'ping':
          this.send(socket, createEnvelope('pong', {}, envelope.id));
          break;
        case 'close_tunnel':
          socket.close();
          break;
        default:
          this.logger.warn(`Unknown message type: ${envelope.type}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to handle message: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.send(
        socket,
        createEnvelope('tunnel_error', {
          message: error instanceof Error ? error.message : 'Invalid message',
        }),
      );
    }
  }

  private handleRegister(
    socket: WebSocket,
    payload: RegisterTunnelPayload,
    correlationId: string,
  ): void {
    if (!payload || typeof payload.localPort !== 'number') {
      this.send(
        socket,
        createEnvelope(
          'tunnel_error',
          { message: 'localPort is required' },
          correlationId,
        ),
      );
      return;
    }

    const subdomain = this.normalizeSubdomain(payload.subdomain) ?? this.randomSubdomain();
    const tunnelId = generateId();
    const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000';
    const publicUrl = `${baseUrl.replace(/\/$/, '')}${TUNNEL_HTTP_PREFIX}/${subdomain}`;

    this.registry.register({
      tunnelId,
      subdomain,
      localPort: payload.localPort,
      socket,
      createdAt: new Date(),
    });

    this.send(
      socket,
      createEnvelope(
        'tunnel_ready',
        { tunnelId, subdomain, publicUrl },
        correlationId,
      ),
    );

    this.logger.log(`Tunnel ready: ${publicUrl} → localhost:${payload.localPort}`);
  }

  private onClose(socket: WebSocket): void {
    this.manager.rejectPendingForSocket(socket, 'Tunnel disconnected');
    const removed = this.registry.removeBySocket(socket);
    if (removed) {
      this.logger.log(`Tunnel closed: ${removed.subdomain}`);
    }
  }

  private normalizeSubdomain(value?: string): string | undefined {
    if (!value) return undefined;
    const normalized = value.toLowerCase().trim();
    if (!/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(normalized)) {
      throw new Error('Invalid subdomain. Use 3–63 chars: lowercase letters, numbers, hyphens.');
    }
    return normalized;
  }

  private randomSubdomain(): string {
    return generateId().replace(/-/g, '').slice(0, 10);
  }

  private send(socket: WebSocket, envelope: ReturnType<typeof createEnvelope>): void {
    if (socket.readyState === socket.OPEN) {
      socket.send(serializeEnvelope(envelope));
    }
  }
}
