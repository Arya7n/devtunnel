# @devtunnel/shared

Shared constants, TypeScript types, and Zod schemas used by CLI, server, and dashboard.

## Exports

- `constants` — server URL, WS path, tunnel HTTP prefix, Redis key prefix, timeouts
- `types` — `TunnelInfo`, `UserSummary`, `TunnelStatus`
- `schemas` — `exposeOptionsSchema` (port / subdomain validation)

## Scripts

```bash
pnpm --filter @devtunnel/shared build
pnpm --filter @devtunnel/shared typecheck
```
