# 10. Deployment

## Target (Phase 8–9)

- AWS EC2 (Ubuntu) or similar VPS
- Docker Compose for Postgres, Redis, server
- Caddy for TLS + wildcard `*.devtunnel.app`
- PM2 or container restart policies for process management
- Wildcard DNS A/AAAA → host

## Local (current)

```bash
cp .env.example .env
pnpm docker:up          # Postgres + Redis — required
pnpm --filter @devtunnel/server prisma:push
pnpm --filter @devtunnel/server dev
pnpm --filter @devtunnel/dashboard dev
```

| Service | Port |
|---------|------|
| Server | 4000 |
| Dashboard | 3300 |
| Postgres | 5432 |
| Redis | 6379 |

## Phase 8 checklist (not done)

1. Point `*.devtunnel.app` at the server
2. Terminate TLS at Caddy; reverse-proxy to Nest
3. Switch public URLs from `/t/<sub>` path routing to Host-based subdomains
4. Set strong `JWT_SECRET` / `JWT_REFRESH_SECRET` and non-default DB passwords
5. Persist volumes for Postgres + Redis on the host
