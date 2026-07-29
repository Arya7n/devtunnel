import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

/**
 * Placeholder Redis service — connection logic added next.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  onModuleDestroy(): void {
    this.logger.debug('RedisService shutting down');
  }
}
