# @devtunnel/protocol

WebSocket message contracts between the CLI and tunnel server.

## Exports

- `messages` — envelope + auth / register / HTTP payload types
- `envelope` — `createEnvelope`, `parseEnvelope`, `serializeEnvelope`, `generateId`
- `events` — high-level protocol event name constants

Spec: [docs/07-websocket-protocol.md](../../docs/07-websocket-protocol.md)

## Scripts

```bash
pnpm --filter @devtunnel/protocol build
pnpm --filter @devtunnel/protocol typecheck
```
