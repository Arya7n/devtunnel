import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { TunnelModule } from './tunnel/tunnel.module';
import { DashboardApiModule } from './dashboard-api/dashboard-api.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // pnpm filter runs with cwd=apps/server; also allow monorepo root .env
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    TunnelModule,
    DashboardApiModule,
  ], 
  controllers: [HealthController],
})
export class AppModule {}
   