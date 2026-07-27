const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface TunnelInfo {
  tunnelId: string;
  subdomain: string;
  localPort: number;
  createdAt: string;
}

export interface RequestEntry {
  requestId: string;
  subdomain: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

export interface Stats {
  activeTunnels: number;
  totalRequests: number;
  requestsLastMinute: number;
  avgDurationMs: number;
}

export const api = {
  tunnels: () => fetchJson<TunnelInfo[]>('/api/tunnels'),
  requests: (subdomain?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (subdomain) params.set('subdomain', subdomain);
    params.set('limit', String(limit));
    return fetchJson<RequestEntry[]>(`/api/requests?${params}`);
  },
  stats: () => fetchJson<Stats>('/api/stats'),
  health: () => fetchJson<{ status: string; service: string }>('/health'),
};
