# DevTunnel — Current Status

> **Living doc for agents & humans.** Update this whenever a phase slice lands.
> Last updated: 2026-07-28

## Phase

**Phase 6 in progress / largely done: Authentication**

Local HTTP tunnel MVP (Phases 3–4) works. Dashboard request inspector exists. Auth (accounts, JWT, API keys, CLI login, protected WS + `/api`) is implemented.

## What works now

1. Register / login via REST (`/auth/*`) and dashboard UI
2. JWT access + refresh tokens; `dt_...` API keys
3. CLI: `register`, `login`, `logout`, `status`, `expose` (requires login)
4. WebSocket `auth` must succeed before `register_tunnel`
5. Dashboard `/api/*` requires Bearer JWT or API key; scoped to the user
6. Local tunnel forward: `http://localhost:4000/t/<subdomain>/...`

## What does NOT work yet

- Redis-backed registry (still in-memory)
- Persisting request logs / tunnel history in Postgres (users/keys only)
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

# CLI
pnpm --filter @devtunnel/cli dev -- register
pnpm --filter @devtunnel/cli dev -- login
pnpm --filter @devtunnel/cli dev -- expose 3000 --subdomain myapp

# Dashboard (login with same account)
pnpm --filter @devtunnel/dashboard dev
```

## Key files

| Area | Path |
|------|------|
| Prisma models | `apps/server/prisma/schema.prisma` |
| Auth service / routes | `apps/server/src/auth/` |
| WS auth gate | `apps/server/src/tunnel/tunnel-ws.service.ts` |
| Protected dashboard API | `apps/server/src/dashboard-api/` |
| CLI config + login | `apps/cli/src/config.ts`, `auth-commands.ts` |
| Dashboard login UI | `apps/dashboard/src/app/page.tsx` |

## Next steps (in order)

1. **Persist request logs / tunnels** in Postgres (extend Prisma models)
2. **Redis registry** for multi-instance / restart survival
3. **Phase 8 Deploy** — Caddy wildcard TLS + DNS `*.devtunnel.app`
4. Refresh tokens rotation hardening / HTTP-only cookies for dashboard (optional)

## Decisions / conventions

- Local public URL shape: `/t/<subdomain>/...`
- Bodies over WS are base64 JSON frames (MVP)
- CLI stores credentials in `~/.devtunnel/config.json` (API key preferred)
- Dashboard stores access token in `localStorage`
- Auth is for the **tunnel owner** (CLI + dashboard), not for public inbound traffic

## If context is lost

1. Read this file
2. Read `docs/08-authentication.md` and `docs/03-architecture.md`
3. Continue from **Next steps** above — do not re-scaffold
