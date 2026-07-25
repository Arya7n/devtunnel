# @devtunnel/cli

Command-line client for creating and managing tunnels.

## Commands

```bash
devtunnel expose 3000
devtunnel expose 3000 --subdomain myapp
devtunnel expose 3000 --server http://localhost:4000
devtunnel login    # stub
devtunnel status   # stub
```

`expose` is implemented for the local MVP (WS + localhost proxy + reconnect).

## Scripts

```bash
pnpm --filter @devtunnel/cli dev -- expose 3000
pnpm --filter @devtunnel/cli build
```

Progress tracker: [docs/STATUS.md](../../docs/STATUS.md)
