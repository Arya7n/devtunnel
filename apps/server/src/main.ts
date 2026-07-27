import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TunnelWsService } from './tunnel/tunnel-ws.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({ origin: true, credentials: true });
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;

  await app.listen(port);

  const httpServer = app.getHttpServer();
  app.get(TunnelWsService).attach(httpServer);

  console.log(`DevTunnel server listening on http://localhost:${port}`);
  console.log(`Tunnel WS: ws://localhost:${port}/tunnel`);
  console.log(`Tunnel HTTP: http://localhost:${port}/t/<subdomain>/...`);
}

bootstrap();
