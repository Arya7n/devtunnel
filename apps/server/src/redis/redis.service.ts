import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;
  private ready = false;
  private readonly initPromise: Promise<void>;

  constructor(private readonly config: ConfigService) {
    // Start connecting as soon as the provider is constructed so later
    // OnModuleInit hooks (e.g. TunnelRegistry) can await readiness.
    this.initPromise = this.connect();
  }

  async onModuleInit(): Promise<void> {
    await this.initPromise;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => this.client?.disconnect());
      this.client = undefined;
      this.ready = false;
    }
  }

  isReady(): boolean {
    return this.ready && this.client?.status === 'ready';
  }

  /** Wait until Redis is connected (or fail if connect failed). */
  async ensureReady(): Promise<void> {
    await this.initPromise;
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      await this.ensureReady();
      const result = await this.getClient().ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    await this.ensureReady();
    return this.getClient().get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.ensureReady();
    if (ttlSeconds && ttlSeconds > 0) {
      await this.getClient().set(key, value, 'EX', ttlSeconds);
      return;
    }
    await this.getClient().set(key, value);
  }

  /** SET key value NX — returns true if set, false if key already existed */
  async setNx(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    await this.ensureReady();
    if (ttlSeconds && ttlSeconds > 0) {
      const result = await this.getClient().set(key, value, 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    }
    const result = await this.getClient().set(key, value, 'NX');
    return result === 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    await this.ensureReady();
    return this.getClient().del(...keys);
  }

  async keys(pattern: string): Promise<string[]> {
    await this.ensureReady();
    return this.getClient().keys(pattern);
  }

  private async connect(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6380';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 5_000,
    });

    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis error: ${error.message}`);
      this.ready = false;
    });
    this.client.on('connect', () => {
      this.logger.log(`Redis connecting to ${url}`);
    });
    this.client.on('ready', () => {
      this.ready = true;
      this.logger.log('Redis ready');
    });

    try {
      await this.client.connect();
      await this.client.ping();
      this.ready = true;
    } catch (error) {
      this.ready = false;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to connect to Redis at ${url}: ${message}`);
      try {
        this.client.disconnect();
      } catch {
        // ignore
      }
      this.client = undefined;
      throw new Error(
        `Redis unavailable at ${url}. Start it with: pnpm docker:up (expects host port 6380). Original: ${message}`,
      );
    }
  }
}
