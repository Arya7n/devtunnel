# @devtunnel/cli

Command-line client for creating and managing tunnels — including a **standalone Windows `.exe`** like ngrok.

## Standalone installable (recommended)

Build the exe (from monorepo root):

```bash
pnpm cli:exe
```

Output:

```
apps/cli/release/devtunnel.exe
apps/cli/release/install.ps1
apps/cli/release/README.txt
```

Install on this PC (adds to your user PATH):

```powershell
powershell -ExecutionPolicy Bypass -File apps/cli/release/install.ps1
```

Open a **new** terminal:

```bash
devtunnel --version
devtunnel login
devtunnel expose 3000 --subdomain myapi
```

You can also copy `devtunnel.exe` anywhere and run it directly — no Node/pnpm required.

> The exe still needs a DevTunnel **server** (local `:4000` or a hosted URL via `DEVTUNNEL_SERVER_URL`).

## Global link (needs Node)

```bash
pnpm cli:link
devtunnel status
```

## Development (no install)

```bash
pnpm --filter @devtunnel/cli cli -- login
pnpm --filter @devtunnel/cli cli -- expose 3000 --subdomain myapi
```

Use `cli` (not `dev`) for interactive commands like `login`.

## Commands

| Command | Description |
|---------|-------------|
| `register` | Create an account |
| `login` | Store API key in `~/.devtunnel/config.json` |
| `logout` | Clear credentials |
| `expose <port>` | Open a tunnel to localhost |
| `http <port>` | Alias for `expose` |
| `status` | Account, server health, active tunnels |

## Config

- File: `~/.devtunnel/config.json` (Windows: `%USERPROFILE%\.devtunnel\config.json`)
- Env: `DEVTUNNEL_SERVER_URL` (default `http://localhost:4000`)

Progress tracker: [docs/STATUS.md](../../docs/STATUS.md)
