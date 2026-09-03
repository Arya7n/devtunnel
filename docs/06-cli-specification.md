# 6. CLI Specification

Binary: `devtunnel`

## Commands

```bash
devtunnel register
devtunnel login
devtunnel logout
devtunnel expose <port> [--subdomain <name>]
devtunnel http <port> [--subdomain <name>]
devtunnel status
```

## `expose` flow

1. Load API key or access token from `~/.devtunnel/config.json` (via `devtunnel login`)
2. Open WebSocket to tunnel server
3. Send `auth` then `register_tunnel`
4. Receive `tunnel_ready` with `publicUrl`
5. Print URL; keep process alive
6. On `http_request`, proxy to `localhost:<port>`, reply `http_response`
7. On disconnect, exponential backoff reconnect

### Run locally

```bash
pnpm --filter @devtunnel/cli cli -- login
pnpm --filter @devtunnel/cli cli -- expose 3000 --subdomain myapp
```

Use `cli` (not `dev`) for interactive commands like `login`.

## Config

- File: `~/.devtunnel/config.json`
- Env: `DEVTUNNEL_SERVER_URL` (default `http://localhost:4000`)

Stored fields: `serverUrl`, `email`, `accessToken`, `refreshToken`, `apiKey` (preferred for tunnels).
