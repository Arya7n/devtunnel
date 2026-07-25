import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TunnelIngressMiddleware } from './tunnel-ingress.middleware';
import { TunnelManagerService } from './tunnel-manager.service';
import { TunnelRegistryService } from './tunnel-registry.service';
import { TunnelWsService } from './tunnel-ws.service';

@Module({
  providers: [TunnelManagerService, TunnelRegistryService, TunnelWsService, TunnelIngressMiddleware],
  exports: [TunnelManagerService, TunnelRegistryService, TunnelWsService],
})
export class TunnelModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TunnelIngressMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
