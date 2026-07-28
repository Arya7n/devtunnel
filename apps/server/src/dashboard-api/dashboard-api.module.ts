import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TunnelModule } from '../tunnel/tunnel.module';
import { DashboardApiController } from './dashboard-api.controller';

@Module({
  imports: [TunnelModule, AuthModule],
  controllers: [DashboardApiController],
})
export class DashboardApiModule {}
