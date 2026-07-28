/** High-level protocol event names for logging / metrics */
export const ProtocolEvents = {
  AUTH: 'auth',
  TUNNEL_REGISTERED: 'tunnel_registered',
  REQUEST_FORWARDED: 'request_forwarded',
  RECONNECT: 'reconnect',
  DISCONNECT: 'disconnect',
} as const;

export type ProtocolEvent = (typeof ProtocolEvents)[keyof typeof ProtocolEvents];
 