# @devtunnel/server

NestJS backend: tunnel engine, auth, and dashboard API.

## Modules

| Module | Role |
|--------|------|
| `auth/` | JWT, refresh tokens, API keys |
| `tunnel/` | WebSocket tunnels, manager, registry |
| `dashboard-api/` | REST endpoints for the UI |
| `health/` | Liveness probe |

## Scripts

```bash
pnpm --filter @devtunnel/server dev
```

Default port: `4000`
