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

## Later (request persistence)

### Tunnel / RequestLog
- Still in-memory on the server for live dashboard; DB models TBD
