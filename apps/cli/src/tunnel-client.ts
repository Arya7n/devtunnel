import {
  createEnvelope,
  parseEnvelope,
  serializeEnvelope,
  type HttpRequestPayload,
  type RegisterTunnelPayload,
  type TunnelReadyPayload,
} from '@devtunnel/protocol';
import { DEFAULT_SERVER_URL, DEFAULT_WS_PATH } from '@devtunnel/shared';
import WebSocket from 'ws';
import { proxyToLocalhost } from './localhost-proxy';

export interface ExposeOptions {
  localPort: number;
  subdomain?: string;
  serverUrl?: string;
}

export async function exposeTunnel(options: ExposeOptions): Promise<void> {
  const serverUrl = options.serverUrl ?? process.env.DEVTUNNEL_SERVER_URL ?? DEFAULT_SERVER_URL;
  const wsUrl = toWsUrl(serverUrl, DEFAULT_WS_PATH);

  console.log(`Connecting to ${wsUrl}...`);

  await connectWithRetry(wsUrl, options);
}

async function connectWithRetry(wsUrl: string, options: ExposeOptions): Promise<void> {
  let attempt = 0;

  for (;;) {
    try {
      await runSession(wsUrl, options);
      return;
    } catch (error) {
      attempt += 1;
      const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 15_000);
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Tunnel disconnected (${message}). Reconnecting in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

function runSession(wsUrl: string, options: ExposeOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    let settled = false;
    const localPort = options.localPort;

    const cleanup = () => {
      process.removeListener('SIGINT', onSignal);
      process.removeListener('SIGTERM', onSignal);
    };

    const settleOk = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const settleErr = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        socket.close();
      } catch {
        // ignore
      }
      reject(error);
    };

    const onSignal = () => {
      console.log('\nClosing tunnel...');
      try {
        socket.close();
      } catch {
        // ignore
      }
      settleOk();
      process.exit(0);
    };

    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);

    socket.on('open', () => {
      socket.send(serializeEnvelope(createEnvelope('auth', { token: 'local-dev' })));

      const payload: RegisterTunnelPayload = {
        localPort: options.localPort,
        subdomain: options.subdomain,
      };
      socket.send(serializeEnvelope(createEnvelope('register_tunnel', payload)));
    });

    socket.on('message', (raw) => {
      void (async () => {
        try {
          const envelope = parseEnvelope(raw as Buffer);

          switch (envelope.type) {
            case 'auth_ok':
              break;
            case 'auth_error':
              settleErr(new Error('Authentication failed'));
              break;
            case 'tunnel_ready': {
              const ready = envelope.payload as TunnelReadyPayload;
              console.log('');
              console.log('Tunnel established');
              console.log(`  Public URL : ${ready.publicUrl}`);
              console.log(`  Forwarding : ${ready.publicUrl} -> http://127.0.0.1:${localPort}`);
              console.log('');
              console.log('Press Ctrl+C to stop.');
              break;
            }
            case 'tunnel_error': {
              const message =
                typeof envelope.payload === 'object' &&
                envelope.payload &&
                'message' in envelope.payload
                  ? String((envelope.payload as { message: string }).message)
                  : 'Tunnel error';
              settleErr(new Error(message));
              break;
            }
            case 'http_request': {
              const request = envelope.payload as HttpRequestPayload;
              try {
                const response = await proxyToLocalhost(localPort, request);
                socket.send(serializeEnvelope(createEnvelope('http_response', response)));
                console.log(`${request.method} ${request.path} -> ${response.status}`);
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                socket.send(
                  serializeEnvelope(
                    createEnvelope('http_response', {
                      requestId: request.requestId,
                      status: 502,
                      headers: { 'content-type': 'application/json' },
                      bodyBase64: Buffer.from(
                        JSON.stringify({ error: 'Local forward failed', detail: message }),
                      ).toString('base64'),
                    }),
                  ),
                );
                console.error(`Forward error ${request.method} ${request.path}: ${message}`);
              }
              break;
            }
            case 'force_close':
              settleErr(new Error('Server closed the tunnel'));
              break;
            default:
              break;
          }
        } catch (error) {
          console.error(
            `Bad message from server: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      })();
    });

    socket.on('close', () => {
      settleErr(new Error('socket closed'));
    });

    socket.on('error', (error) => {
      settleErr(error);
    });
  });
}

function toWsUrl(serverUrl: string, path: string): string {
  const url = new URL(serverUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = path;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
