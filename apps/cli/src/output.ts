import type { TunnelInfo } from './api';

const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function label(text: string): string {
  return `${DIM}${text.padEnd(14)}${RESET}`;
}

export function printTunnelReady(input: {
  publicUrl: string;
  localPort: number;
  subdomain: string;
  email?: string;
}): void { 
  console.log('');
  console.log(`${GREEN}✓ Tunnel online${RESET}`);
  console.log('');
  if (input.email) {
    console.log(`${label('Account')}${input.email}`);
  }
  console.log(`${label('Subdomain')}${input.subdomain}`);
  console.log(`${label('Public URL')}${CYAN}${input.publicUrl}${RESET}`);
  console.log(
    `${label('Forwarding')}${input.publicUrl} ${DIM}→${RESET} http://127.0.0.1:${input.localPort}`,
  );
  console.log('');
  console.log(`${DIM}Press Ctrl+C to stop. Requests will appear below.${RESET}`);
  console.log('');
}

export function printStatus(input: {
  email?: string;
  serverUrl: string;
  credentialType: 'API key' | 'access token';
  serverOk: boolean;
  redis?: string;
  tunnels: TunnelInfo[];
}): void {
  console.log('');
  console.log(`${GREEN}DevTunnel CLI${RESET}`);
  console.log('');
  console.log(`${label('Account')}${input.email ?? '(unknown)'}`);
  console.log(`${label('Server')}${input.serverUrl}`);
  console.log(`${label('Credential')}${input.credentialType}`);
  console.log(
    `${label('Server health')}${input.serverOk ? `${GREEN}online${RESET}` : `${YELLOW}offline${RESET}`}`,
  );
  if (input.redis) {
    console.log(`${label('Redis')}${input.redis}`);
  }

  console.log('');
  console.log(`${label('Active tunnels')}${input.tunnels.length}`);
  if (input.tunnels.length === 0) {
    console.log(`  ${DIM}No live tunnels. Run: devtunnel expose <port>${RESET}`);
  } else {
    for (const t of input.tunnels) {
      const base = input.serverUrl.replace(/\/$/, '');
      const url = `${base}/t/${t.subdomain}`;
      console.log(`  ${CYAN}${t.subdomain}${RESET}  :${t.localPort}  ${DIM}${url}${RESET}`);
    }
  }
  console.log('');
}

export function formatRequestLog(
  requestId: string,
  method: string,
  path: string,
  status: number,
  durationMs: number,
): string {
  const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : GREEN;
  return `${DIM}${requestId.slice(0, 8)}${RESET} ${method.padEnd(6)} ${path} ${statusColor}${status}${RESET} ${DIM}${durationMs}ms${RESET}`;
}
