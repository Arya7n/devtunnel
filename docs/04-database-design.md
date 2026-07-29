# Database Design

Prisma schema: `apps/server/prisma/schema.prisma`

## Entities (auth slice)

### User
- `id`, `email` (unique), `passwordHash`, `name?`, timestamps

### ApiKey
- `id`, `userId`, `label`, `keyPrefix`, `keyHash` (unique), `createdAt`, `revokedAt?`, `lastUsedAt?`
- Plaintext key shown once at creation (`dt_...`)

### RefreshToken
- `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt?`

## Persistence (Phase 7)

### Tunnel
- `id` (tunnelId from WS), `userId`, `subdomain`, `localPort`
- `status`: `active` | `closed`
- `createdAt`, `closedAt?`
- Live sockets stay in-memory; DB tracks open/close history
- On server boot, any leftover `active` rows are marked `closed`

### RequestLog
- `requestId` (unique), `userId`, `tunnelId?`, `subdomain`
- `method`, `path`, `status`, `durationMs`, `createdAt`
- Dashboard `/api/requests` and `/api/stats` read from Postgres
- Retention: keep latest ~1000 logs per user
