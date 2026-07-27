import { Injectable } from '@nestjs/common';
import type WebSocket from 'ws';

export interface ActiveTunnel {
  tunnelId: string;
  subdomain: string;
  localPort: number;
  socket: WebSocket;
  createdAt: Date;
}

@Injectable()
export class TunnelRegistryService {
  private readonly bySubdomain = new Map<string, ActiveTunnel>();
  private readonly bySocket = new Map<WebSocket, ActiveTunnel>();

  register(tunnel: ActiveTunnel): void {
    const existing = this.bySubdomain.get(tunnel.subdomain);
    if (existing && existing.socket !== tunnel.socket) {
      throw new SubdomainTakenError(tunnel.subdomain);
    }

    this.bySubdomain.set(tunnel.subdomain, tunnel);
    this.bySocket.set(tunnel.socket, tunnel);
  }

  getBySubdomain(subdomain: string): ActiveTunnel | undefined {
    return this.bySubdomain.get(subdomain);
  }

  getBySocket(socket: WebSocket): ActiveTunnel | undefined {
    return this.bySocket.get(socket);
  }

  removeBySocket(socket: WebSocket): ActiveTunnel | undefined {
    const tunnel = this.bySocket.get(socket);
    if (!tunnel) return undefined;
    this.bySocket.delete(socket);
    const current = this.bySubdomain.get(tunnel.subdomain);
    if (current?.socket === socket) {
      this.bySubdomain.delete(tunnel.subdomain);
    }
    return tunnel;
  }

  list(): ActiveTunnel[] {
    return [...this.bySubdomain.values()];
  }
}

export class SubdomainTakenError extends Error {
  constructor(subdomain: string) {
    super(`Subdomain "${subdomain}" is already in use by another tunnel`);
    this.name = 'SubdomainTakenError';
  }
}
