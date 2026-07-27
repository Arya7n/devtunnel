import { Injectable } from '@nestjs/common';

export interface RequestLogEntry {
  requestId: string;
  subdomain: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

const MAX_ENTRIES = 200;

@Injectable()
export class RequestLogService {
  private readonly entries: RequestLogEntry[] = [];

  push(entry: RequestLogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_ENTRIES);
    }
  }

  list(subdomain?: string, limit = 50): RequestLogEntry[] {
    let filtered = this.entries;
    if (subdomain) {
      filtered = filtered.filter((e) => e.subdomain === subdomain);
    }
    return filtered.slice(-limit).reverse();
  }

  clear(): void {
    this.entries.length = 0;
  }
}
