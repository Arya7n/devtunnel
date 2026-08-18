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
# Requires Node 20+ (see .nvmrc) and pnpm
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
| Dashboard | http://localhost:3300 |
| Server | http://localhost:4000 |
| Health | http://localhost:4000/health |

## Documentation

See [docs/](./docs/README.md) for vision, architecture, protocol, and roadmap.

## Status

**Phase 3–4 — Local tunnel MVP.** CLI can expose a port; server forwards HTTP over WebSocket.

See **[docs/STATUS.md](./docs/STATUS.md)** for what works, how to test, and what to build next.

### CLI (standalone exe)

```bash
pnpm cli:exe
powershell -ExecutionPolicy Bypass -File apps/cli/release/install.ps1
# new terminal:
devtunnel login
devtunnel expose 3000 --subdomain myapp
```

### CLI (Node link)

```bash
pnpm cli:link
devtunnel login
devtunnel expose 3000 --subdomain myapp
devtunnel status
```

### Local tunnel smoke test

```bash
pnpm --filter @devtunnel/shared build && pnpm --filter @devtunnel/protocol build
pnpm --filter @devtunnel/server dev
# other terminal: local app on :3000
pnpm --filter @devtunnel/cli cli -- expose 3000
curl http://localhost:4000/t/<subdomain>/
```
