# 11. Scaling

## Current (single node)

- One Nest process holds all WebSocket sockets in memory
- Redis stores subdomain ownership metadata (`devtunnel:tunnel:<sub>`)
- On startup, stale Redis tunnel keys are cleared (single-node MVP)
- Postgres holds users, keys, tunnel history, request logs

## Phase 10 ideas

- Horizontal tunnel servers behind a load balancer
- Sticky sessions **or** Redis pub/sub to route HTTP to the instance that owns the socket
- Shard by subdomain hash
- Separate control plane (auth/API) from data plane (tunnels)
- CDN / edge for static dashboard assets

Multi-instance routing is **not** implemented yet — Redis alone does not move sockets across processes.
