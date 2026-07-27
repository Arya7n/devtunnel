import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TunnelIngressMiddleware } from './tunnel-ingress.middleware';
import { TunnelManagerService } from './tunnel-manager.service';
import { TunnelRegistryService } from './tunnel-registry.service';
import { TunnelWsService } from './tunnel-ws.service';
import { RequestLogService } from './request-log.service';

@Module({
  providers: [TunnelManagerService, TunnelRegistryService, TunnelWsService, TunnelIngressMiddleware, RequestLogService],
  exports: [TunnelManagerService, TunnelRegistryService, TunnelWsService, RequestLogService],
})
export class TunnelModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TunnelIngressMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
