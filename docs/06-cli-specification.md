# 6. CLI Specification

Binary: `devtunnel`

## Commands (MVP)

```bash
devtunnel login
devtunnel logout
devtunnel expose <port> [--subdomain <name>]
devtunnel status
```

## `expose` flow

1. Load stored auth token (or prompt login) — *stub token for now*
2. Open WebSocket to tunnel server
3. Send `auth` then `register_tunnel`
4. Receive `tunnel_ready` with `publicUrl`
5. Print URL; keep process alive
6. On `http_request`, proxy to `localhost:<port>`, reply `http_response`
7. On disconnect, exponential backoff reconnect

### Implemented (local MVP)

```bash
pnpm --filter @devtunnel/cli dev -- expose 3000
pnpm --filter @devtunnel/cli dev -- expose 3000 --subdomain myapp
pnpm --filter @devtunnel/cli dev -- expose 3000 --server http://localhost:4000
```

## Config

Default config path: `~/.devtunnel/config.json` (not used yet)

Env override: `DEVTUNNEL_SERVER_URL`
