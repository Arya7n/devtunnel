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
| `auth_ok` / `auth_error` | — |
| `tunnel_ready` | `{ tunnelId, subdomain, publicUrl }` |
| `tunnel_error` | `{ message }` |
| `http_request` | `{ requestId, method, path, headers, bodyBase64? }` |
| `pong` | `{}` |
| `force_close` | `{ reason }` |

Bodies are base64 to safely carry binary over JSON frames (MVP). Streaming may come later.
