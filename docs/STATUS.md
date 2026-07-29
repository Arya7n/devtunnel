# DevTunnel — Current Status

> **Living doc for agents & humans.** Update this whenever a phase slice lands.
> Last updated: 2026-07-29

## Phase

**Phase 7 in progress: Persistence (tunnels + request logs in Postgres)**

Auth (Phase 6) works. Tunnel open/close and HTTP request logs are now written to Postgres. Live active tunnels remain in-memory until Redis.

## What works now

1. Register / login via REST (`/auth/*`) and dashboard UI
2. JWT access + refresh tokens; `dt_...` API keys
3. CLI: `register`, `login`, `logout`, `status`, `expose` (requires login)
4. WebSocket `auth` must succeed before `register_tunnel`
5. Dashboard `/api/*` requires Bearer JWT or API key; scoped to the user
6. Local tunnel forward: `http://localhost:4000/t/<subdomain>/...`
7. **Postgres `Tunnel` + `RequestLog`** — request history survives server restarts
8. Stale `active` tunnels are closed on server startup

## What does NOT work yet

- Redis-backed registry (still in-memory for live sockets)
- Wildcard DNS + HTTPS (Caddy)
- Custom domains, TCP tunnels, request replay

## Prerequisites

```bash
cp .env.example .env
pnpm docker:up
pnpm --filter @devtunnel/server prisma:push
```

## How to smoke-test auth + tunnel

```bash
pnpm --filter @devtunnel/shared build
pnpm --filter @devtunnel/protocol build
pnpm --filter @devtunnel/server dev

# CLI (use `cli` not `dev` for interactive login)
pnpm --filter @devtunnel/cli cli -- login
pnpm --filter @devtunnel/cli cli -- expose 3000 --subdomain myapp

# Dashboard (login with same account)
pnpm --filter @devtunnel/dashboard dev
```

## Key files

| Area | Path |
|------|------|
| Prisma models | `apps/server/prisma/schema.prisma` |
| Request/tunnel persistence | `apps/server/src/tunnel/request-log.service.ts` |
| Auth service / routes | `apps/server/src/auth/` |
| WS auth gate | `apps/server/src/tunnel/tunnel-ws.service.ts` |
| Protected dashboard API | `apps/server/src/dashboard-api/` |
| CLI config + login | `apps/cli/src/config.ts`, `auth-commands.ts` |
| Dashboard login UI | `apps/dashboard/src/app/page.tsx` |

## Next steps (in order)

1. **Redis registry** for multi-instance / restart survival of live tunnels
2. **Phase 8 Deploy** — Caddy wildcard TLS + DNS `*.devtunnel.app`
3. Refresh tokens rotation hardening / HTTP-only cookies for dashboard (optional)

## Decisions / conventions

- Local public URL shape: `/t/<subdomain>/...`
- Bodies over WS are base64 JSON frames (MVP)
- CLI stores credentials in `~/.devtunnel/config.json` (API key preferred)
- Dashboard stores access token in `localStorage`
- Auth is for the **tunnel owner** (CLI + dashboard), not for public inbound traffic
- Request logs capped at ~1000 rows per user
- Active tunnel list in dashboard = live in-memory registry; request history = Postgres

## If context is lost

1. Read this file
2. Read `docs/08-authentication.md` and `docs/03-architecture.md`
3. Continue from **Next steps** above — do not re-scaffold
