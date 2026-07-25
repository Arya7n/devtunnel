# DevTunnel

Secure localhost tunneling platform — expose local apps with a public HTTPS URL.

```bash
devtunnel expose 3000
# → https://abc123.devtunnel.app
```

Inspired by ngrok / Cloudflare Tunnel / LocalTunnel; built from scratch for learning and production use.

## Monorepo

```
apps/
  dashboard/   Next.js + Tailwind — developer dashboard
  server/      NestJS — tunnel engine, auth, API
  cli/         Commander CLI — `devtunnel expose`
packages/
  shared/      Types, Zod schemas, constants
  protocol/    WebSocket message contracts
  ui/          Shared React components
docker/        Compose (Postgres, Redis), Dockerfiles
docs/          Architecture & specifications
```

## Quick start

```bash
# Requires Node 20+ and pnpm
corepack enable
pnpm install
cp .env.example .env

# Infrastructure
pnpm docker:up

# Run (separate terminals)
pnpm --filter @devtunnel/server dev
pnpm --filter @devtunnel/dashboard dev
pnpm --filter @devtunnel/cli dev
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| Server | http://localhost:4000 |
| Health | http://localhost:4000/health |

## Documentation

See [docs/](./docs/README.md) for vision, architecture, protocol, and roadmap.

## Status

**Phase 2 — Architecture & scaffold.** Feature work starts next (CLI → Tunnel Engine → Dashboard).
