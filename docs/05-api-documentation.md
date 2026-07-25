# 5. API Documentation

Base URL (local): `http://localhost:4000`

## Health

`GET /health` → `{ status: "ok" }`

## Auth (planned)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Issue access + refresh tokens |
| POST | `/auth/refresh` | Rotate tokens |
| POST | `/auth/logout` | Invalidate refresh token |

## Tunnels (planned)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tunnels` | List user tunnels |
| GET | `/tunnels/:id` | Tunnel detail |
| GET | `/tunnels/:id/logs` | Request logs |

OpenAPI / Swagger will be added when endpoints land.
