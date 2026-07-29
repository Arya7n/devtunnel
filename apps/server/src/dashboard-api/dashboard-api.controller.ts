import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.service';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { TunnelRegistryService } from '../tunnel/tunnel-registry.service';
import { RequestLogService } from '../tunnel/request-log.service';

@Controller('api')
@UseGuards(BearerAuthGuard)
export class DashboardApiController {
  constructor(
    private readonly registry: TunnelRegistryService,
    private readonly requestLog: RequestLogService,
  ) {}

  @Get('tunnels')
  listTunnels(@CurrentUser() user: AuthUser) {
    // Live connections only (in-memory). History is in Postgres via RequestLog/Tunnel rows.
    return this.registry.list(user.id).map((t) => ({
      tunnelId: t.tunnelId,
      subdomain: t.subdomain,
      localPort: t.localPort,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  @Get('requests')
  async listRequests(
    @CurrentUser() user: AuthUser,
    @Query('subdomain') subdomain?: string,
    @Query('limit') limit?: string,
  ) {
    return this.requestLog.list(user.id, subdomain, limit ? Number(limit) : undefined);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: AuthUser) {
    const tunnels = this.registry.list(user.id);
    const { total, recent, avgDurationMs } = await this.requestLog.countRecent(user.id, 60_000);

    return {
      activeTunnels: tunnels.length,
      totalRequests: total,
      requestsLastMinute: recent,
      avgDurationMs,
      redisTunnels: await this.registry.redisCount(),
      instanceId: this.registry.instanceId,
    };
  }

  @Delete('requests')
  async clearRequests(@CurrentUser() user: AuthUser) {
    await this.requestLog.clear(user.id);
    return { cleared: true };
  }
}
