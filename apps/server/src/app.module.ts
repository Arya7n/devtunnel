import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { TunnelModule } from './tunnel/tunnel.module';
import { DashboardApiModule } from './dashboard-api/dashboard-api.module';

@Module({
  imports: [AuthModule, TunnelModule, DashboardApiModule],
  controllers: [HealthController],
})
export class AppModule {}
