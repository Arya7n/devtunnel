import { Injectable } from '@nestjs/common';
import { REDIS_TUNNEL_KEY_PREFIX } from '@devtunnel/shared';
import { RedisService } from '../redis/redis.service';

export interface TunnelRedisMeta {
  tunnelId: string;
  subdomain: string;
  localPort: number;
  userId: string;
  instanceId: string;
  createdAt: string;
}

@Injectable()
export class TunnelRedisStore {
  constructor(private readonly redis: RedisService) {}

  keyFor(subdomain: string): string {
    return `${REDIS_TUNNEL_KEY_PREFIX}${subdomain}`;
  }

  async get(subdomain: string): Promise<TunnelRedisMeta | null> {
    const raw = await this.redis.get(this.keyFor(subdomain));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TunnelRedisMeta;
    } catch {
      return null;
    }
  }

  /** Reserve subdomain atomically. Returns false if already taken. */
  async claim(meta: TunnelRedisMeta): Promise<boolean> {
    return this.redis.setNx(this.keyFor(meta.subdomain), JSON.stringify(meta));
  }

  async refresh(meta: TunnelRedisMeta): Promise<void> {
    await this.redis.set(this.keyFor(meta.subdomain), JSON.stringify(meta));
  }

  async release(subdomain: string): Promise<void> {
    await this.redis.del(this.keyFor(subdomain));
  }

  async listAll(): Promise<TunnelRedisMeta[]> {
    const keys = await this.redis.keys(`${REDIS_TUNNEL_KEY_PREFIX}*`);
    const out: TunnelRedisMeta[] = [];
    for (const key of keys) {
      const raw = await this.redis.get(key);
      if (!raw) continue;
      try {
        out.push(JSON.parse(raw) as TunnelRedisMeta);
      } catch {
        // skip corrupt
      }
    }
    return out;
  }

  async clearAll(): Promise<number> {
    const keys = await this.redis.keys(`${REDIS_TUNNEL_KEY_PREFIX}*`);
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
  }
}
