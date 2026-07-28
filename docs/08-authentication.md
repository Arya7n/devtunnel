# 8. Authentication

Auth identifies the **tunnel owner** (developer). Public visitors hitting a tunnel URL do not log in.

## Model

- Email/password registration
- Short-lived JWT access tokens
- Refresh tokens (stored hashed in Postgres)
- Long-lived API keys for CLI (`dt_...`, hashed at rest)

## REST

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | no | Create account |
| POST | `/auth/login` | no | Issue tokens |
| POST | `/auth/refresh` | no | Rotate refresh token |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/auth/api-keys` | Bearer | Create API key (returns plaintext once) |
| GET | `/auth/api-keys` | Bearer | List keys |
| DELETE | `/auth/api-keys/:id` | Bearer | Revoke key |

## CLI

```bash
devtunnel register
devtunnel login      # stores API key in ~/.devtunnel/config.json
devtunnel logout
devtunnel expose 3000
```

WebSocket `auth` payload uses the stored API key (or access token).

## Dashboard

Login/register form stores the access token in `localStorage` and sends `Authorization: Bearer …` to `/api/*`.

## WebSocket

1. CLI connects to `/tunnel`
2. Sends `auth` with token
3. Server validates JWT or API key → `auth_ok` / `auth_error`
4. Only then accepts `register_tunnel`
