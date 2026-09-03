# 7. WebSocket Protocol

Shared types: `@devtunnel/protocol`

Connection: `ws(s)://<server>/tunnel`

## Envelope

```ts
{
  type: string;
  id: string;        // correlation id
  payload: unknown;
  timestamp: number;
}
```

## Client → Server

| type | payload |
|------|---------|
| `auth` | `{ token }` |
| `register_tunnel` | `{ localPort, subdomain? }` |
| `http_response` | `{ requestId, status, headers, bodyBase64? }` |
| `ping` | `{}` |
| `close_tunnel` | `{ tunnelId }` |

## Server → Client

| type | payload |
|------|---------|
| `auth_ok` | `{ userId, email }` |
| `auth_error` | `{ message }` |
| `tunnel_ready` | `{ tunnelId, subdomain, publicUrl }` |
| `tunnel_error` | `{ message }` |
| `http_request` | `{ requestId, method, path, headers, bodyBase64? }` |
| `pong` | `{}` |
| `force_close` | `{ reason }` |

Bodies are base64 to safely carry binary over JSON frames (MVP). Streaming may come later.

## Helpers

`@devtunnel/protocol` exports:

- `createEnvelope(type, payload, id?)`
- `parseEnvelope(raw)`
- `serializeEnvelope(envelope)`
- `generateId()`

## Local MVP notes

- `auth` validates a JWT or `dt_...` API key; success → `auth_ok` with `{ userId, email }`; failure → `auth_error` then the socket closes
- `register_tunnel` is rejected until `auth` succeeds
- `tunnel_ready.publicUrl` looks like `http://localhost:4000/t/<subdomain>` until DNS/HTTPS exists
