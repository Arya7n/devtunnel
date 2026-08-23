# @devtunnel/server

NestJS backend: tunnel engine, auth, and dashboard API.

## Modules

| Module | Role |
|--------|------|
| `auth/` | JWT, refresh tokens, API keys |
| `tunnel/` | WebSocket tunnels, manager, registry, HTTP ingress, Redis sync |
| `dashboard-api/` | REST endpoints for the UI (`/api/*`) |
| `health/` | Liveness + Redis status |
| `redis/` | Redis client for live subdomain registry |
| `prisma/` | Postgres ORM |

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness, Redis up/down, tunnel counts |
| `POST /auth/register` | Create account |
| `POST /auth/login` | Issue tokens |
| `POST /auth/refresh` | Rotate refresh token |
| `GET /auth/me` | Current user (Bearer) |
| `POST /auth/api-keys` | Create API key (Bearer) |
| `GET /auth/api-keys` | List API keys (Bearer) |
| `DELETE /auth/api-keys/:id` | Revoke key (Bearer) |
| `GET /api/tunnels` | Active tunnels (Bearer) |
| `GET /api/requests` | Request log (Bearer) |
| `GET /api/stats` | Dashboard stats (Bearer) |
| `WS /tunnel` | CLI control plane |
| `ALL /t/:subdomain/*` | Public HTTP ingress → forwarded to CLI |

## Scripts

```bash
pnpm --filter @devtunnel/server dev
pnpm --filter @devtunnel/server prisma:push
```

Default port: `4000`

Progress tracker: [docs/STATUS.md](../../docs/STATUS.md)
