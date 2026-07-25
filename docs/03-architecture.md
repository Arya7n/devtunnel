# 3. Architecture

## Request path

```
Internet
  → Wildcard DNS (*.devtunnel.app)
  → Reverse Proxy (Caddy / Nginx + TLS)
  → Tunnel Server (NestJS)
  → Tunnel Manager + Registry
  → Persistent WebSocket
  → Developer CLI
  → localhost:<port>
```

## Monorepo layout

```
apps/
  dashboard/   # Next.js UI
  server/      # NestJS API + tunnel engine
  cli/         # Node CLI (commander)
packages/
  shared/      # Types, Zod schemas, constants
  protocol/    # WebSocket message contracts
  ui/          # Shared React components
docker/        # Compose, Dockerfiles, Caddy
docs/          # Architecture & specs
```

## Core server modules

| Module | Responsibility |
|--------|----------------|
| Auth | Register/login, JWT, API keys |
| Tunnel Manager | Active WS sessions, reconnect |
| Tunnel Registry | subdomain → connection mapping (Redis) |
| Dashboard API | REST for UI (logs, tunnels, account) |
| Request Inspector | Capture request/response metadata |

## Data stores

- **PostgreSQL** — users, tunnels, request logs
- **Redis** — live registry, sessions, rate limits
