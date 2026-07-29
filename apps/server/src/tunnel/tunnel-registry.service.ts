import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type WebSocket from 'ws';
import { TunnelRedisStore } from './tunnel-redis.store';

export interface ActiveTunnel {
  tunnelId: string;
  subdomain: string;
  localPort: number;
  userId: string;
  socket: WebSocket;
  createdAt: Date;
}

@Injectable()
export class TunnelRegistryService implements OnModuleInit {
  private readonly logger = new Logger(TunnelRegistryService.name);
  private readonly bySubdomain = new Map<string, ActiveTunnel>();
  private readonly bySocket = new Map<WebSocket, ActiveTunnel>();
  /** Identifies this server process in Redis metadata */
  readonly instanceId = randomUUID();

  constructor(private readonly redisStore: TunnelRedisStore) {}

  /**
   * Single-node MVP: wipe leftover Redis tunnel keys from a previous crash/restart.
   * CLI clients reconnect and re-claim subdomains.
   */
  async onModuleInit(): Promise<void> {
    const cleared = await this.redisStore.clearAll();
    if (cleared > 0) {
      this.logger.warn(`Cleared ${cleared} stale Redis tunnel key(s) on startup`);
    } else {
      this.logger.log('Redis tunnel registry is clean on startup');
    }
  }

  async register(tunnel: ActiveTunnel): Promise<void> {
    const existingLocal = this.bySubdomain.get(tunnel.subdomain);
    if (existingLocal && existingLocal.socket !== tunnel.socket) {
      throw new SubdomainTakenError(tunnel.subdomain);
    }

    // Same socket re-register (reconnect edge case): refresh Redis + maps
    if (existingLocal?.socket === tunnel.socket) {
      await this.redisStore.refresh({
        tunnelId: tunnel.tunnelId,
        subdomain: tunnel.subdomain,
        localPort: tunnel.localPort,
        userId: tunnel.userId,
        instanceId: this.instanceId,
        createdAt: tunnel.createdAt.toISOString(),
      });
      this.bySubdomain.set(tunnel.subdomain, tunnel);
      this.bySocket.set(tunnel.socket, tunnel);
      return;
    }

    const claimed = await this.redisStore.claim({
      tunnelId: tunnel.tunnelId,
      subdomain: tunnel.subdomain,
      localPort: tunnel.localPort,
      userId: tunnel.userId,
      instanceId: this.instanceId,
      createdAt: tunnel.createdAt.toISOString(),
    });

    if (!claimed) {
      throw new SubdomainTakenError(tunnel.subdomain);
    }

    this.bySubdomain.set(tunnel.subdomain, tunnel);
    this.bySocket.set(tunnel.socket, tunnel);
    this.logger.debug(`Registered ${tunnel.subdomain} in memory + Redis`);
  }

  getBySubdomain(subdomain: string): ActiveTunnel | undefined {
    return this.bySubdomain.get(subdomain);
  }

  getBySocket(socket: WebSocket): ActiveTunnel | undefined {
    return this.bySocket.get(socket);
  }

  async removeBySocket(socket: WebSocket): Promise<ActiveTunnel | undefined> {
    const tunnel = this.bySocket.get(socket);
    if (!tunnel) return undefined;
    this.bySocket.delete(socket);
    const current = this.bySubdomain.get(tunnel.subdomain);
    if (current?.socket === socket) {
      this.bySubdomain.delete(tunnel.subdomain);
      await this.redisStore.release(tunnel.subdomain);
      this.logger.debug(`Released ${tunnel.subdomain} from memory + Redis`);
    }
    return tunnel;
  }

  list(userId?: string): ActiveTunnel[] {
    const all = [...this.bySubdomain.values()];
    return userId ? all.filter((t) => t.userId === userId) : all;
  }

  /** Live socket count on this instance */
  localCount(): number {
    return this.bySubdomain.size;
  }

  async redisCount(): Promise<number> {
    return (await this.redisStore.listAll()).length;
  }
}

export class SubdomainTakenError extends Error {
  constructor(subdomain: string) {
    super(`Subdomain "${subdomain}" is already in use by another tunnel`);
    this.name = 'SubdomainTakenError';
  }
}
