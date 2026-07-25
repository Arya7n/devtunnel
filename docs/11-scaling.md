# 11. Scaling

## Phase 10 ideas

- Horizontal tunnel servers behind a load balancer
- Sticky sessions or Redis-backed connection registry
- Shard by subdomain hash
- Separate control plane (auth/API) from data plane (tunnels)
- CDN / edge for static dashboard assets

MVP runs on a single tunnel server process.
