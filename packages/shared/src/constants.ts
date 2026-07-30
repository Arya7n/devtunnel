export const APP_NAME = 'DevTunnel';
export const DEFAULT_TUNNEL_DOMAIN = 'devtunnel.app';
export const DEFAULT_SERVER_URL = 'http://localhost:4000';
export const DEFAULT_WS_PATH = '/tunnel';

/** Local MVP public path: http://localhost:4000/t/<subdomain>/... */
export const TUNNEL_HTTP_PREFIX = '/t';

/** How long the server waits for the CLI to answer an HTTP forward */
export const HTTP_FORWARD_TIMEOUT_MS = 30_000;

/** Default Redis URL for local docker-compose (host maps 6380 → container 6379) */
export const DEFAULT_REDIS_URL = 'redis://localhost:6380';

/** Redis key prefix for live tunnel registry metadata */
export const REDIS_TUNNEL_KEY_PREFIX = 'devtunnel:tunnel:';
