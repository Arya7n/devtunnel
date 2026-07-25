# DevTunnel — Current Status

> **Living doc for agents & humans.** Update this whenever a phase slice lands.
> Last updated: 2026-07-26

## Phase

**Phase 3–4 in progress: local tunnel MVP (CLI + tunnel engine)**

Scaffold (Phase 2) is done. First end-to-end local HTTP tunnel is implemented.

## What works now

1. CLI connects over WebSocket to `ws://localhost:4000/tunnel`
2. CLI registers a tunnel (`register_tunnel`)
3. Server returns `tunnel_ready` with a local public URL:
   `http://localhost:4000/t/<subdomain>`
4. Inbound HTTP to `/t/<subdomain>/...` is forwarded over WS to the CLI
5. CLI proxies to `http://127.0.0.1:<port>` and returns `http_response`
6. Basic auto-reconnect on disconnect
7. Auth message accepted with stub token (not real auth yet)

**Verified locally (2026-07-26):** `expose 3000 --subdomain smoke` → `curl http://localhost:4000/t/smoke/` returned local app body.

## What does NOT work yet

- Real JWT / API key auth
- Postgres / Prisma persistence
- Redis-backed registry (in-memory only)
- Dashboard UI / request inspector
- Wildcard DNS + HTTPS (Caddy)
- Custom domains, TCP tunnels, request replay

## How to smoke-test

```bash
# Terminal 1 — tunnel server
pnpm --filter @devtunnel/shared build
pnpm --filter @devtunnel/protocol build
pnpm --filter @devtunnel/server dev

# Terminal 2 — any local app (example)
npx --yes serve -l 3000

# Terminal 3 — CLI
pnpm --filter @devtunnel/cli dev -- expose 3000
# optional: --subdomain myapp

# Terminal 4 — hit the tunnel
curl http://localhost:4000/t/<subdomain>/
```

## Key files

| Area | Path |
|------|------|
| Protocol types + envelope helpers | `packages/protocol/src/` |
| Shared constants | `packages/shared/src/constants.ts` |
| WS gateway | `apps/server/src/tunnel/tunnel-ws.service.ts` |
| Registry (memory) | `apps/server/src/tunnel/tunnel-registry.service.ts` |
| HTTP forwarder | `apps/server/src/tunnel/tunnel-manager.service.ts` |
| HTTP ingress `/t/*` | `apps/server/src/tunnel/tunnel-ingress.middleware.ts` |
| CLI expose + reconnect | `apps/cli/src/tunnel-client.ts` |
| Localhost proxy | `apps/cli/src/localhost-proxy.ts` |

## Next steps (in order)

1. **Harden local MVP** — better logging, request IDs in server logs, edge-case headers/body
2. **Simple request log buffer** (in-memory) for later dashboard
3. **Phase 6 Auth** — JWT + API keys; reject unauthenticated WS
4. **Phase 5 Dashboard** — show active tunnels + recent requests
5. **Phase 7 Persistence** — Prisma models + Postgres; Redis registry
6. **Phase 8 Deploy** — Caddy wildcard TLS + DNS `*.devtunnel.app`

## Decisions / conventions

- Local public URL shape: `/t/<subdomain>/...` (Host-based routing comes with real DNS later)
- Bodies over WS are base64 JSON frames (MVP)
- Auth is intentionally a no-op until Phase 6
- Registry is process-local `Map` until Redis
- CLI strips a bare `--` from argv so `pnpm ... start -- expose ... --subdomain x` works

## If context is lost

1. Read this file
2. Read `docs/03-architecture.md` and `docs/07-websocket-protocol.md`
3. Continue from **Next steps** above — do not re-scaffold
