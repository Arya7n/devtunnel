#!/usr/bin/env bash
set -euo pipefail

echo "Bootstrapping DevTunnel local environment..."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Enable via: corepack enable && corepack prepare pnpm@9.15.0 --activate"
  exit 1
fi

pnpm install

echo "Starting Postgres + Redis..."
pnpm docker:up

echo "Done. Next:"
echo "  pnpm --filter @devtunnel/server dev"
echo "  pnpm --filter @devtunnel/dashboard dev"
echo "  pnpm --filter @devtunnel/cli dev"
