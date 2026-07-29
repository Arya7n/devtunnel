# Local infrastructure (Postgres + Redis)

## Start

Requires Docker Desktop running.

```bash
# from repo root
pnpm docker:up
# or:
docker compose -f docker/docker-compose.yml up -d
```

## Services

| Service | Port | Credentials |
|---------|------|-------------|
| Postgres | 5432 | user/pass/db: `devtunnel` |
| Redis | 6379 | none (local) |

## Stop

```bash
pnpm docker:down
```

## Notes

- The Nest server **requires Redis** at boot (`REDIS_URL`).
- After Postgres is up: `pnpm --filter @devtunnel/server prisma:push`
