import { Controller, Delete, Get, Query } from '@nestjs/common';
import { TunnelRegistryService } from '../tunnel/tunnel-registry.service';
import { RequestLogService } from '../tunnel/request-log.service';

@Controller('api')
export class DashboardApiController {
  constructor(
    private readonly registry: TunnelRegistryService,
    private readonly requestLog: RequestLogService,
  ) {}

  @Get('tunnels')
  listTunnels() {
    return this.registry.list().map((t) => ({
      tunnelId: t.tunnelId,
      subdomain: t.subdomain,
      localPort: t.localPort,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  @Get('requests')
  listRequests(
    @Query('subdomain') subdomain?: string,
    @Query('limit') limit?: string,
  ) {
    return this.requestLog.list(subdomain, limit ? Number(limit) : undefined);
  }

  @Get('stats')
  getStats() {
    const tunnels = this.registry.list();
    const requests = this.requestLog.list(undefined, 200);
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
  clearRequests() {
    this.requestLog.clear();
    return { cleared: true };
  }
}
