#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning build artifacts..."
pnpm -r exec rimraf dist .next .turbo coverage 2>/dev/null || true
echo "Clean complete."
