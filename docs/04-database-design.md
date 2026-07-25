# 4. Database Design

Prisma schema will live in `apps/server/prisma/schema.prisma` (Phase 7).

## Planned entities

### User
- id, email, passwordHash, name, createdAt

### ApiKey
- id, userId, keyHash, label, createdAt, revokedAt

### Tunnel
- id, userId, subdomain, localPort, status, createdAt, closedAt

### RequestLog
- id, tunnelId, method, path, statusCode, durationMs, createdAt
- optional: requestHeaders, responseHeaders (JSON)

## Notes

- Subdomains must be unique while a tunnel is active
- Request bodies may be truncated or sampled for storage size
- Soft-delete / revoke for API keys
