# 13. Testing

## Layers

- Unit: protocol parsing, registry, auth helpers
- Integration: CLI ↔ server WS handshake (testcontainers)
- E2E: expose port → HTTP hit public URL → localhost receives request

## Commands (once added)

```bash
pnpm test
pnpm --filter @devtunnel/server test
```
