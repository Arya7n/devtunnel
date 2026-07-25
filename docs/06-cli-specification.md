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

1. Load stored auth token (or prompt login)
2. Open WebSocket to tunnel server
3. Send `auth` then `register_tunnel`
4. Receive `tunnel_ready` with `publicUrl`
5. Print URL; keep process alive
6. On `http_request`, proxy to `localhost:<port>`, reply `http_response`
7. On disconnect, exponential backoff reconnect

## Config

Default config path: `~/.devtunnel/config.json`
