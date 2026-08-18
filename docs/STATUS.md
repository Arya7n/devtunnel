# DevTunnel — Current Status

> **Living doc for agents & humans.** Update this whenever a phase slice lands.
> Last updated: 2026-08-18

## Phase

**Phase 7 mostly done: Persistence + Redis live registry**

Auth works. Postgres stores users/keys/tunnels/request logs. Redis stores live subdomain ownership metadata. WebSocket handles remain in-process memory.

## What works now

1. Register / login via REST (`/auth/*`) and dashboard UI
2. JWT access + refresh tokens; `dt_...` API keys
3. CLI: `register`, `login`, `logout`, `status`, `expose` (requires login)
4. WebSocket `auth` must succeed before `register_tunnel`
5. Dashboard `/api/*` requires Bearer JWT or API key; scoped to the user
6. Local tunnel forward: `http://localhost:4000/t/<subdomain>/...`
7. Postgres `Tunnel` + `RequestLog` — request history survives restarts
8. **Redis registry** — subdomain claims via `devtunnel:tunnel:<subdomain>`
9. Stale Redis keys cleared on server startup (single-node)
10. `GET /health` reports Redis up/down + local/redis tunnel counts

## What does NOT work yet

- Multi-instance routing (socket still on one process; Redis is metadata only)
- Wildcard DNS + HTTPS (Caddy)
- Custom domains, TCP tunnels, request replay

## Prerequisites (manual)

```bash
cp .env.example .env          # ensure REDIS_URL=redis://localhost:6379
pnpm docker:up                # Postgres + Redis — REQUIRED
pnpm --filter @devtunnel/server prisma:push
```

Docker Desktop must be running. Without Redis, the server **fails to start**.

## How to smoke-test

```bash
pnpm --filter @devtunnel/shared build
pnpm --filter @devtunnel/protocol build
pnpm --filter @devtunnel/server dev

curl http://localhost:4000/health
# expect redis: "up"

pnpm --filter @devtunnel/cli cli -- login
pnpm --filter @devtunnel/cli cli -- expose 3000 --subdomain myapp
pnpm --filter @devtunnel/dashboard dev
```

## Key files

| Area | Path |
|------|------|
| Redis client | `apps/server/src/redis/` |
| Tunnel Redis store | `apps/server/src/tunnel/tunnel-redis.store.ts` |
| Registry (memory + Redis) | `apps/server/src/tunnel/tunnel-registry.service.ts` |
| Prisma models | `apps/server/prisma/schema.prisma` |
| Auth | `apps/server/src/auth/` |
| CLI config | `apps/cli/src/config.ts` |

## Next steps (in order)

1. **Phase 8 Deploy** — Caddy wildcard TLS + DNS `*.devtunnel.app`
2. Multi-instance sticky routing / pub-sub (only if scaling beyond one server)
3. Optional: HTTP-only cookies for dashboard; rate limits

## Decisions / conventions

- Local public URL shape: `/t/<subdomain>/...`
- Redis key: `devtunnel:tunnel:<subdomain>` → JSON metadata (not the socket)
- On startup, clear all tunnel Redis keys (single-node MVP)
- CLI stores credentials in `~/.devtunnel/config.json`
- Dashboard stores access token in `localStorage`

## If context is lost

1. Read this file
2. Read `docs/03-architecture.md` and `docs/08-authentication.md`
3. Continue from **Next steps** — do not re-scaffold
