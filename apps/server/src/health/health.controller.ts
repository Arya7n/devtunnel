import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { TunnelRegistryService } from '../tunnel/tunnel-registry.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly redis: RedisService,
    private readonly registry: TunnelRegistryService,
  ) {}

  @Get()
  async check() {
    const redisOk = await this.redis.ping();
    return {
      status: redisOk ? 'ok' : 'degraded',
      service: 'devtunnel-server',
      redis: redisOk ? 'up' : 'down',
      tunnels: {
        local: this.registry.localCount(),
        redis: await this.registry.redisCount(),
        instanceId: this.registry.instanceId,
      },
    };
  }
}
