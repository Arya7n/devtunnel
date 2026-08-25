# @devtunnel/dashboard

Next.js developer dashboard for DevTunnel.

## Responsibilities

- Authentication UI (login / register)
- Live tunnel status (scoped to signed-in user)
- Request inspector / logs from Postgres
- Account session via `localStorage` access token

## Scripts

```bash
pnpm --filter @devtunnel/dashboard dev
```

Runs on `http://localhost:3300`.

Requires the server at `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).

## Auth note

Sign in with the same account used by `devtunnel login`. Public visitors of `/t/<subdomain>` do not use the dashboard.
