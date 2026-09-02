#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Cleaning build artifacts in $ROOT..."
pnpm -r exec rimraf dist .next .turbo coverage 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true
echo "Clean complete. (node_modules left intact — use pnpm clean at root to remove them)"
