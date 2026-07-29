# 3. Architecture

## Request path (production target)

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

## Request path (local MVP — current)

```
curl http://localhost:4000/t/<subdomain>/hello
  → Tunnel Ingress middleware
  → Tunnel Manager (pending request map)
  → WebSocket `http_request` frame
  → CLI
  → http://127.0.0.1:<port>/hello
  → WebSocket `http_response` frame
  → HTTP response to curl
```

CLI connects to `ws://localhost:4000/tunnel` and sends `register_tunnel`.

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

- **PostgreSQL** — users, API keys, tunnels, request logs
- **Redis** — live subdomain ownership metadata (`devtunnel:tunnel:<sub>`)
  - WebSocket connections stay in the Nest process memory
  - On single-node startup, stale Redis tunnel keys are cleared
