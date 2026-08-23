#!/usr/bin/env bash
set -euo pipefail

echo "Bootstrapping DevTunnel local environment..."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Enable via: corepack enable && corepack prepare pnpm@9.15.0 --activate"
  exit 1
fi

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

pnpm install

echo "Starting Postgres + Redis..."
pnpm docker:up

echo "Waiting for Postgres..."
sleep 3

echo "Pushing Prisma schema..."
pnpm --filter @devtunnel/server prisma:push

echo ""
echo "Done. Next:"
echo "  pnpm --filter @devtunnel/server dev"
echo "  pnpm --filter @devtunnel/dashboard dev"
echo "  pnpm --filter @devtunnel/cli cli -- login"
