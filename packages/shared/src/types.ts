export type TunnelStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface TunnelInfo {
  id: string;
  subdomain: string;
  publicUrl: string;
  localPort: number;
  status: TunnelStatus;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string | null;
}
