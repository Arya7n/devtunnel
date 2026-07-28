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
    return this.registry.list(user.id).map((t) => ({
      tunnelId: t.tunnelId,
      subdomain: t.subdomain,
      localPort: t.localPort,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  @Get('requests')
  listRequests(
    @CurrentUser() user: AuthUser,
    @Query('subdomain') subdomain?: string,
    @Query('limit') limit?: string,
  ) {
    const userSubs = new Set(this.registry.list(user.id).map((t) => t.subdomain));
    const entries = this.requestLog.list(subdomain, limit ? Number(limit) : undefined);
    return entries.filter((entry) => userSubs.has(entry.subdomain));
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthUser) {
    const tunnels = this.registry.list(user.id);
    const userSubs = new Set(tunnels.map((t) => t.subdomain));
    const requests = this.requestLog
      .list(undefined, 200)
      .filter((r) => userSubs.has(r.subdomain));
    const now = Date.now();
    const recentRequests = requests.filter((r) => now - r.timestamp < 60_000);

    return {
      activeTunnels: tunnels.length,
      totalRequests: requests.length,
      requestsLastMinute: recentRequests.length,
      avgDurationMs:
        recentRequests.length > 0
          ? Math.round(recentRequests.reduce((sum, r) => sum + r.durationMs, 0) / recentRequests.length)
          : 0,
    };
  }

  @Delete('requests')
  clearRequests(@CurrentUser() user: AuthUser) {
    // MVP: clear only entries for this user's active subdomains
    const userSubs = new Set(this.registry.list(user.id).map((t) => t.subdomain));
    const remaining = this.requestLog.list(undefined, 10_000).filter((e) => !userSubs.has(e.subdomain));
    this.requestLog.clear();
    for (const entry of remaining) {
      this.requestLog.push(entry);
    }
    return { cleared: true };
  }
}
