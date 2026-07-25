# 10. Deployment

## Target (Phase 8–9)

- AWS EC2 (Ubuntu)
- Docker Compose for Postgres, Redis, server
- Caddy for TLS + wildcard `*.devtunnel.app`
- PM2 or container restart policies for process management
- Wildcard DNS A/AAAA → EC2

## Local

```bash
pnpm docker:up          # Postgres + Redis
pnpm --filter @devtunnel/server dev
```
