import { Module } from '@nestjs/common';
import { TunnelManagerService } from './tunnel-manager.service';
import { TunnelRegistryService } from './tunnel-registry.service';

/**
 * Tunnel engine — WebSocket tunnels, HTTP forwarding, reconnect.
 * Implementation planned for Phase 4.
 */
@Module({
  providers: [TunnelManagerService, TunnelRegistryService],
  exports: [TunnelManagerService, TunnelRegistryService],
})
export class TunnelModule {}
