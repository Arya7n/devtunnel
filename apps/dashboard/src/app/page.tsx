'use client';

import { useQuery } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import {
  api,
  clearSession,
  getAccessToken,
  getStoredUser,
  setSession,
  type RequestEntry,
  type TunnelInfo,
  type Stats,
} from '../lib/api';

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`}
    />
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-sky-500/20 text-sky-300',
    POST: 'bg-emerald-500/20 text-emerald-300',
    PUT: 'bg-amber-500/20 text-amber-300',
    PATCH: 'bg-orange-500/20 text-orange-300',
    DELETE: 'bg-red-500/20 text-red-300',
  };
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${colors[method] ?? 'bg-white/10 text-white/70'}`}
    >
      {method}
    </span>
  );
}

function StatusCode({ code }: { code: number }) {
  let color = 'text-emerald-400';
  if (code >= 400) color = 'text-amber-400';
  if (code >= 500) color = 'text-red-400';
  return <span className={`font-mono text-sm ${color}`}>{code}</span>;
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function AuthScreen({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(email, password, name || undefined);
      setSession(result.accessToken, result.user);
      onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-[var(--accent)]">DevTunnel</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Sign in to view your tunnels and request logs.
      </p>
      <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-white/10 bg-[var(--surface)] p-5">
        {mode === 'register' && (
          <input
            className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          placeholder="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          placeholder="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[#0b0f14] disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <button
        type="button"
        className="mt-4 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
      </button>
    </div>
  );
}

function TunnelsSection({
  tunnels,
  selectedSubdomain,
  onSelectSubdomain,
}: {
  tunnels: TunnelInfo[];
  selectedSubdomain?: string;
  onSelectSubdomain: (subdomain: string) => void;
}) {
  if (tunnels.length === 0) {
    return (
      <div className="rounded-lg border border-white/5 bg-[var(--surface)] p-6 text-center text-[var(--muted)]">
        No active tunnels. Run{' '}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-[var(--accent)]">
          devtunnel expose &lt;port&gt;
        </code>{' '}
        after <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">devtunnel login</code>.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tunnels.map((t) => (
        <div
          key={t.tunnelId}
          role="button"
          tabIndex={0}
          onClick={() => onSelectSubdomain(t.subdomain)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectSubdomain(t.subdomain);
          }}
          className={`flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-[var(--surface)] px-4 py-3 transition-colors ${
            selectedSubdomain === t.subdomain
              ? 'border-[var(--accent)]'
              : 'border-white/5 hover:border-white/10'
          }`}
        >
          <StatusDot ok />
          <span className="font-mono text-sm text-[var(--accent)]">{t.subdomain}</span>
          <span className="text-xs text-[var(--muted)]">:{t.localPort}</span>
          <span className="ml-auto text-xs text-[var(--muted)]">
            {new Date(t.createdAt).toLocaleTimeString()}
          </span>
          <a
            href={`http://localhost:4000/t/${t.subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--accent)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            /t/{t.subdomain}
          </a>
        </div>
      ))}
    </div>
  );
}

function RequestsTable({ requests }: { requests: RequestEntry[] }) {
  if (requests.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted)]">
        No requests yet. Hit a tunnel URL to see traffic here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-[var(--muted)]">
            <th className="pb-2 pr-4">Method</th>
            <th className="pb-2 pr-4">Path</th>
            <th className="pb-2 pr-4">Subdomain</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2 pr-4">Duration</th>
            <th className="pb-2">When</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.requestId} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="py-2 pr-4">
                <MethodBadge method={r.method} />
              </td>
              <td className="py-2 pr-4 font-mono text-xs">{r.path}</td>
              <td className="py-2 pr-4 text-xs text-[var(--muted)]">{r.subdomain}</td>
              <td className="py-2 pr-4">
                <StatusCode code={r.status} />
              </td>
              <td className="py-2 pr-4 text-xs text-[var(--muted)]">{r.durationMs}ms</td>
              <td className="py-2 text-xs text-[var(--muted)]">{timeAgo(r.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuthenticatedDashboard({ onLogout }: { onLogout: () => void }) {
  const user = getStoredUser();
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 5000 });
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats, refetchInterval: 3000 });
  const tunnels = useQuery({ queryKey: ['tunnels'], queryFn: api.tunnels, refetchInterval: 3000 });
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedSubdomain && tunnels.data && tunnels.data.length > 0) {
      setSelectedSubdomain(tunnels.data[0].subdomain);
    }
  }, [selectedSubdomain, tunnels.data]);

  const requests = useQuery({
    queryKey: ['requests', selectedSubdomain ?? 'all'],
    queryFn: () => api.requests(selectedSubdomain),
    refetchInterval: 3000,
  });

  const serverUp = health.data?.status === 'ok';
  const s: Stats = stats.data ?? {
    activeTunnels: 0,
    totalRequests: 0,
    requestsLastMinute: 0,
    avgDurationMs: 0,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">DevTunnel</h1>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs">
          <StatusDot ok={serverUp} />
          {serverUp ? 'Server online' : 'Connecting...'}
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm text-[var(--muted)]">
          <span>{user?.email}</span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-white/10 px-2 py-1 text-xs hover:border-white/20"
          >
            Log out
          </button>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Tunnels" value={s.activeTunnels} />
        <StatCard label="Total Requests" value={s.totalRequests} />
        <StatCard label="Req / min" value={s.requestsLastMinute} />
        <StatCard label="Avg Latency" value={s.avgDurationMs ? `${s.avgDurationMs}ms` : '-'} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Active Tunnels
        </h2>
        <TunnelsSection
          tunnels={tunnels.data ?? []}
          selectedSubdomain={selectedSubdomain}
          onSelectSubdomain={setSelectedSubdomain}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Recent Requests
        </h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          {selectedSubdomain ? (
            <>
              Filtering by subdomain:{' '}
              <span className="font-mono text-[var(--accent)]">{selectedSubdomain}</span>
            </>
          ) : (
            <>Showing requests across all tunnels</>
          )}
        </p>
        <div className="rounded-lg border border-white/5 bg-[var(--surface)] p-4">
          <RequestsTable requests={requests.data ?? []} />
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getAccessToken()));
  }, []);

  if (!authed) {
    return <AuthScreen onAuthed={() => setAuthed(true)} />;
  }

  return (
    <AuthenticatedDashboard
      onLogout={() => {
        clearSession();
        setAuthed(false);
      }}
    />
  );
}
