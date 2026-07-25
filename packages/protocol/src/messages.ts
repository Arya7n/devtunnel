/**
 * WebSocket protocol messages between CLI and Tunnel Server.
 * Spec lives in docs/07-websocket-protocol.md
 */

export type ClientMessageType =
  | 'auth'
  | 'register_tunnel'
  | 'http_response'
  | 'ping'
  | 'close_tunnel';

export type ServerMessageType =
  | 'auth_ok'
  | 'auth_error'
  | 'tunnel_ready'
  | 'tunnel_error'
  | 'http_request'
  | 'pong'
  | 'force_close';

export interface ProtocolEnvelope<T extends string = string, P = unknown> {
  type: T;
  id: string;
  payload: P;
  timestamp: number;
}

/** CLI → Server: authenticate session */
export interface AuthPayload {
  token: string;
}

/** CLI → Server: request a tunnel for a local port */
export interface RegisterTunnelPayload {
  localPort: number;
  subdomain?: string;
}

/** Server → CLI: tunnel is live */
export interface TunnelReadyPayload {
  tunnelId: string;
  subdomain: string;
  publicUrl: string;
}

/** Server → CLI: inbound HTTP request to forward locally */
export interface HttpRequestPayload {
  requestId: string;
  method: string;
  path: string;
  headers: Record<string, string | string[]>;
  bodyBase64?: string;
}

/** CLI → Server: response from localhost */
export interface HttpResponsePayload {
  requestId: string;
  status: number;
  headers: Record<string, string | string[]>;
  bodyBase64?: string;
}
