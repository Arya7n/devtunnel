import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_LOGS_PER_USER = 1000;

export interface RequestLogEntry {
  requestId: string;
  userId: string;
  tunnelId?: string;
  subdomain: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

@Injectable()
export class RequestLogService implements OnModuleInit {
  private readonly logger = new Logger(RequestLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    // Orphaned "active" rows from a previous server process are not live anymore.
    const result = await this.prisma.tunnel.updateMany({
      where: { status: 'active' },
      data: { status: 'closed', closedAt: new Date() },
    });
    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} stale tunnel(s) as closed on startup`);
    }
  }

  async recordTunnelOpen(input: {
    tunnelId: string;
    userId: string;
    subdomain: string;
    localPort: number;
  }): Promise<void> {
    await this.prisma.tunnel.create({
      data: {
        id: input.tunnelId,
        userId: input.userId,
        subdomain: input.subdomain,
        localPort: input.localPort,
        status: 'active',
      },
    });
  }

  async recordTunnelClose(tunnelId: string): Promise<void> {
    await this.prisma.tunnel.updateMany({
      where: { id: tunnelId, status: 'active' },
      data: { status: 'closed', closedAt: new Date() },
    });
  }

  async push(entry: RequestLogEntry): Promise<void> {
    await this.prisma.requestLog.create({
      data: {
        requestId: entry.requestId,
        userId: entry.userId,
        tunnelId: entry.tunnelId,
        subdomain: entry.subdomain,
        method: entry.method,
        path: entry.path,
        status: entry.status,
        durationMs: entry.durationMs,
        createdAt: new Date(entry.timestamp),
      },
    });

    // Keep a bounded history per user
    const overflow = await this.prisma.requestLog.findMany({
      where: { userId: entry.userId },
      orderBy: { createdAt: 'desc' },
      skip: MAX_LOGS_PER_USER,
      select: { id: true },
    });
    if (overflow.length > 0) {
      await this.prisma.requestLog.deleteMany({
        where: { id: { in: overflow.map((row) => row.id) } },
      });
    }
  }

  async list(userId: string, subdomain?: string, limit = 50): Promise<RequestLogEntry[]> {
    const rows = await this.prisma.requestLog.findMany({
      where: {
        userId,
        ...(subdomain ? { subdomain } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows.map((row) => ({
      requestId: row.requestId,
      userId: row.userId,
      tunnelId: row.tunnelId ?? undefined,
      subdomain: row.subdomain,
      method: row.method,
      path: row.path,
      status: row.status,
      durationMs: row.durationMs,
      timestamp: row.createdAt.getTime(),
    }));
  }

  async clear(userId: string): Promise<void> {
    await this.prisma.requestLog.deleteMany({ where: { userId } });
  }

  async countRecent(userId: string, withinMs: number): Promise<{
    total: number;
    recent: number;
    avgDurationMs: number;
  }> {
    const since = new Date(Date.now() - withinMs);
    const [total, recentRows] = await Promise.all([
      this.prisma.requestLog.count({ where: { userId } }),
      this.prisma.requestLog.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { durationMs: true },
      }),
    ]);

    const avgDurationMs =
      recentRows.length > 0
        ? Math.round(recentRows.reduce((sum, r) => sum + r.durationMs, 0) / recentRows.length)
        : 0;

    return { total, recent: recentRows.length, avgDurationMs };
  }
}
