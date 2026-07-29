import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Redis module — connection + helpers for the live tunnel registry.
 * Wired in subsequent commits.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
