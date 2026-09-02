# 5. API Documentation

Base URL (local): `http://localhost:4000`

## Health

`GET /health`

```json
{
  "status": "ok",
  "service": "devtunnel-server",
  "redis": "up",
  "tunnels": { "local": 1, "redis": 1, "instanceId": "..." }
}
```

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | no | Create account |
| POST | `/auth/login` | no | Issue access + refresh tokens |
| POST | `/auth/refresh` | no | Rotate tokens |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/auth/api-keys` | Bearer | Create API key (`dt_...`) |
| GET | `/auth/api-keys` | Bearer | List keys |
| DELETE | `/auth/api-keys/:id` | Bearer | Revoke key |

## Dashboard API

All routes require `Authorization: Bearer <jwt|api_key>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tunnels` | Active tunnels for user |
| GET | `/api/requests` | Request log (`?subdomain=&limit=`) |
| GET | `/api/stats` | Tunnel + request stats |
| DELETE | `/api/requests` | Clear request log for user |

## Public tunnel ingress

| Method | Path | Description |
|--------|------|-------------|
| ALL | `/t/:subdomain/*` | Forward to CLI over WebSocket |

OpenAPI / Swagger TBD.
