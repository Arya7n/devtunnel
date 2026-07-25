# @devtunnel/server

NestJS backend: tunnel engine, auth, and dashboard API.

## Modules

| Module | Role |
|--------|------|
| `auth/` | JWT, refresh tokens, API keys *(stub)* |
| `tunnel/` | WebSocket tunnels, manager, registry, HTTP ingress |
| `dashboard-api/` | REST endpoints for the UI *(stub)* |
| `health/` | Liveness probe |

## Local MVP endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `WS /tunnel` | CLI control plane |
| `ALL /t/:subdomain/*` | Public HTTP ingress → forwarded to CLI |

## Scripts

```bash
pnpm --filter @devtunnel/server dev
```

Default port: `4000`

Progress tracker: [docs/STATUS.md](../../docs/STATUS.md)
