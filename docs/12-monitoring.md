# 12. Monitoring

## Current

- Nest logger (console) for tunnel open/close and forward errors
- `GET /health` — liveness, Redis up/down, local vs Redis tunnel counts
- Dashboard stats: active tunnels, request totals, avg latency

Example:

```bash
curl http://localhost:4000/health
```

```json
{
  "status": "ok",
  "service": "devtunnel-server",
  "checkedAt": "2026-09-03T08:00:00.000Z",
  "redis": "up",
  "tunnels": { "local": 1, "redis": 1, "instanceId": "..." }
}
```

If Redis ping fails, `status` is `"degraded"` and `redis` is `"down"`.

## Planned

- Pino structured logs
- Metrics: requests/sec, error rate, reconnects
- Optional: Prometheus + Grafana

## Alerts (production)

- Tunnel server down
- Redis / Postgres unreachable
- Spike in auth failures
- Redis tunnel count diverging from local sockets (multi-instance smell)
