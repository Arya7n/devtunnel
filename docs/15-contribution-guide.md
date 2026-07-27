# 15. Contribution Guide

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm docker:up
```

## Dev

```bash
pnpm --filter @devtunnel/server dev
pnpm --filter @devtunnel/dashboard dev
pnpm --filter @devtunnel/cli dev
```

Dashboard runs on `http://localhost:3300`.

## Conventions

- TypeScript strict mode
- Shared types in `@devtunnel/shared` / `@devtunnel/protocol`
- Prefer small PRs aligned to a single phase/module
- Do not commit secrets or `.env`

## Branching

`main` is protected. Feature branches: `feat/...`, `fix/...`, `docs/...`
