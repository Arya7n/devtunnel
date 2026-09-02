# 15. Contribution Guide

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm docker:up
pnpm --filter @devtunnel/server prisma:push
```

**Requires Docker** — Postgres and Redis must be running before starting the server.

Or run the bootstrap script:

```bash
bash scripts/bootstrap.sh
```

## Dev

```bash
pnpm --filter @devtunnel/server dev
pnpm --filter @devtunnel/dashboard dev
pnpm --filter @devtunnel/cli cli -- login
pnpm --filter @devtunnel/cli cli -- expose 3000
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3300 |
| Server | http://localhost:4000 |
| Health | http://localhost:4000/health |

## Conventions

- TypeScript strict mode
- Shared types in `@devtunnel/shared` / `@devtunnel/protocol`
- Prefer small PRs aligned to a single phase/module
- Do not commit secrets or `.env`
- Update [STATUS.md](./STATUS.md) when landing a phase slice
- Format with `pnpm format`; lint with `pnpm lint` before opening a PR

## Branching

`main` is protected. Feature branches: `feat/...`, `fix/...`, `docs/...`
