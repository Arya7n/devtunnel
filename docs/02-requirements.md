# 2. Requirements

## Functional (MVP)

- CLI can authenticate and expose a local port
- Server assigns a unique subdomain and public HTTPS URL
- Inbound HTTP requests are forwarded over a persistent WebSocket to the CLI
- CLI proxies to localhost and returns the response
- Dashboard shows tunnel status and request logs
- Auto-reconnect after network blips

## Non-functional

- HTTPS by default
- Low latency forwarding
- Support multiple simultaneous tunnels per user
- Secure auth (JWT + API keys)
- Observable (structured logs)

## Out of scope for MVP

- Custom domains, TCP tunnels, team collaboration, request replay
