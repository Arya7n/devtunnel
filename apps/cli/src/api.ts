import { getCredential, loadConfig } from './config';

export interface TunnelInfo {
  tunnelId: string;
  subdomain: string;
  localPort: number;
  createdAt: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const config = await loadConfig();
  const token = getCredential(config);
  if (!token) {
    throw new Error('Not logged in. Run: devtunnel login');
  }

  const baseUrl = config.serverUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new Error('Session expired or invalid. Run: devtunnel login');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `API ${path} failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function fetchActiveTunnels(): Promise<TunnelInfo[]> {
  return apiFetch<TunnelInfo[]>('/api/tunnels');
}

export async function fetchHealth(): Promise<{ status: string; redis?: string }> {
  const config = await loadConfig();
  const baseUrl = config.serverUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) {
    throw new Error(`Server unreachable (${res.status})`);
  }
  return res.json() as Promise<{ status: string; redis?: string }>;
}
