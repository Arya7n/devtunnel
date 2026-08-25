# 13. Testing

## Layers (planned)

- Unit: protocol parsing, registry, auth helpers
- Integration: CLI ↔ server WS handshake (testcontainers)
- E2E: expose port → HTTP hit public URL → localhost receives request

## Manual smoke test (works today)

```bash
pnpm docker:up
pnpm --filter @devtunnel/server prisma:push
pnpm --filter @devtunnel/shared build && pnpm --filter @devtunnel/protocol build
pnpm --filter @devtunnel/server dev

# other terminals
pnpm --filter @devtunnel/cli cli -- login
pnpm --filter @devtunnel/cli cli -- expose 3000 --subdomain smoke

# hit tunnel + health
curl http://localhost:4000/t/smoke/
curl http://localhost:4000/health
```

## Commands (once automated)

```bash
pnpm test
pnpm --filter @devtunnel/server test
pnpm typecheck
```
