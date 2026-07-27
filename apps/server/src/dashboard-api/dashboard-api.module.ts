import { Module } from '@nestjs/common';
import { TunnelModule } from '../tunnel/tunnel.module';
import { DashboardApiController } from './dashboard-api.controller';

@Module({
  imports: [TunnelModule],
  controllers: [DashboardApiController],
})
export class DashboardApiModule {}
