# 1. Vision

DevTunnel is a developer platform that securely exposes local applications to the public internet through encrypted tunnels.

```bash
devtunnel expose 3000
# → https://abc123.devtunnel.app
```

## Why build it

Tools like ngrok, Cloudflare Tunnel, and LocalTunnel solve this problem well. DevTunnel is built from scratch to understand the networking, infrastructure, and systems that power them — while delivering a production-quality product.

## Success

A developer installs the CLI, runs `devtunnel expose 3000`, receives a public HTTPS URL, and external HTTP requests reach localhost. The dashboard shows live request history, and tunnels survive temporary network interruptions.
