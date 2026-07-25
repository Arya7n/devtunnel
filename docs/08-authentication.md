# 8. Authentication

## Planned model

- Email/password registration
- Short-lived JWT access tokens
- Refresh tokens (HTTP-only cookie or stored securely for CLI)
- Long-lived API keys for CLI / automation (`dt_...`)

## CLI auth

1. `devtunnel login` → browser or device code / email+password
2. Store tokens in `~/.devtunnel/`
3. WebSocket `auth` message uses access token or API key

Details TBD in Phase 6.
