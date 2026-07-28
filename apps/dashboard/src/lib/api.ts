const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'devtunnel_access_token';
const USER_KEY = 'devtunnel_user';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): { id: string; email: string; name: string | null } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string; email: string; name: string | null };
  } catch {
    return null;
  }
}

export function setSession(
  accessToken: string,
  user: { id: string; email: string; name: string | null },
): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (res.status === 401) {
    clearSession();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `API ${path}: ${res.status}`);
  }
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
  login: (email: string, password: string) =>
    fetchJson<{
      user: { id: string; email: string; name: string | null };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name?: string) =>
    fetchJson<{
      user: { id: string; email: string; name: string | null };
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  me: () => fetchJson<{ user: { id: string; email: string; name: string | null } }>('/auth/me'),
};
