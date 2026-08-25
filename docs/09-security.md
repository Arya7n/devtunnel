# 9. Security

## Principles

- TLS terminated at reverse proxy (Phase 8)
- Authenticate every tunnel connection
- Isolate tunnels by user; no cross-tenant subdomain takeover
- Validate Host header / subdomain mapping strictly
- Rate-limit auth and tunnel creation (planned)
- Never log secrets or full sensitive request bodies by default

## Implemented today

- JWT access tokens + hashed refresh tokens in Postgres
- API keys (`dt_...`) stored as SHA-256 hashes; plaintext shown once
- WebSocket `auth` required before `register_tunnel`
- Dashboard `/api/*` requires Bearer JWT or API key
- Tunnel list / request logs scoped to the authenticated user
- Redis `SET NX` claim for subdomain ownership (single-node)

## Threats to address

- Subdomain squatting across instances
- Stolen API keys (rotation UI / revoke is available; rotation UX TBD)
- Request smuggling / header injection
- Abuse of free tunnels (bandwidth / DoS)
- Dashboard token in `localStorage` (prefer HTTP-only cookies later)

Expanded hardening checklist in Phase 9.
