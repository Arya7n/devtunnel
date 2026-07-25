# 9. Security

## Principles

- TLS terminated at reverse proxy
- Authenticate every tunnel connection
- Isolate tunnels by user; no cross-tenant subdomain takeover
- Validate Host header / subdomain mapping strictly
- Rate-limit auth and tunnel creation
- Never log secrets or full sensitive request bodies by default

## Threats to address

- Subdomain squatting
- Stolen API keys
- Request smuggling / header injection
- Abuse of free tunnels (bandwidth / DoS)

Expanded hardening checklist in Phase 9.
