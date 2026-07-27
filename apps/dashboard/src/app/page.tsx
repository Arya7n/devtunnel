'use client';

import { useQuery } from '@tanstack/react-query';
import { api, type RequestEntry, type TunnelInfo, type Stats } from '../lib/api';

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

function TunnelsSection({ tunnels }: { tunnels: TunnelInfo[] }) {
  if (tunnels.length === 0) {
    return (
      <div className="rounded-lg border border-white/5 bg-[var(--surface)] p-6 text-center text-[var(--muted)]">
        No active tunnels. Run{' '}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-[var(--accent)]">
          devtunnel expose &lt;port&gt;
        </code>{' '}
        to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tunnels.map((t) => (
        <div
          key={t.tunnelId}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/5 bg-[var(--surface)] px-4 py-3"
        >
          <StatusDot ok />
          <span className="font-mono text-sm text-[var(--accent)]">{t.subdomain}</span>
          <span className="text-xs text-[var(--muted)]">
            :{t.localPort}
          </span>
          <span className="ml-auto text-xs text-[var(--muted)]">
            {new Date(t.createdAt).toLocaleTimeString()}
          </span>
          <a
            href={`http://localhost:4000/t/${t.subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--accent)] hover:underline"
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

export default function DashboardPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health });
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats });
  const tunnels = useQuery({ queryKey: ['tunnels'], queryFn: api.tunnels });
  const requests = useQuery({ queryKey: ['requests'], queryFn: () => api.requests() });

  const serverUp = health.data?.status === 'ok';
  const s: Stats = stats.data ?? { activeTunnels: 0, totalRequests: 0, requestsLastMinute: 0, avgDurationMs: 0 };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">DevTunnel</h1>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs">
          <StatusDot ok={serverUp} />
          {serverUp ? 'Server online' : 'Connecting...'}
        </div>
      </header>

      {/* Stats */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Tunnels" value={s.activeTunnels} />
        <StatCard label="Total Requests" value={s.totalRequests} />
        <StatCard label="Req / min" value={s.requestsLastMinute} />
        <StatCard label="Avg Latency" value={s.avgDurationMs ? `${s.avgDurationMs}ms` : '-'} />
      </section>

      {/* Tunnels */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Active Tunnels
        </h2>
        <TunnelsSection tunnels={tunnels.data ?? []} />
      </section>

      {/* Request Log */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Recent Requests
        </h2>
        <div className="rounded-lg border border-white/5 bg-[var(--surface)] p-4">
          <RequestsTable requests={requests.data ?? []} />
        </div>
      </section>
    </div>
  );
}
