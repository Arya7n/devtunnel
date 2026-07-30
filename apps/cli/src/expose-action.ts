import { getCredential, loadConfig } from './config';
import { exposeTunnel } from './tunnel-client';

export async function runExpose(
  port: string,
  opts: { subdomain?: string; server?: string },
): Promise<void> {
  const localPort = Number(port);
  if (!Number.isInteger(localPort) || localPort < 1 || localPort > 65535) {
    console.error('Port must be an integer between 1 and 65535');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig();
  const token = getCredential(config);
  if (!token) {
    console.error('Not logged in. Run: devtunnel login');
    process.exitCode = 1;
    return;
  }

  await exposeTunnel({
    localPort,
    subdomain: opts.subdomain,
    serverUrl: opts.server ?? config.serverUrl,
    token,
    email: config.email,
  });
}
