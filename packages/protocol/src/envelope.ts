import { randomUUID } from 'node:crypto';
import type { ProtocolEnvelope } from './messages';

export function generateId(): string {
  return randomUUID();
}

export function createEnvelope<T extends string, P>(
  type: T,
  payload: P,
  id: string = generateId(),
): ProtocolEnvelope<T, P> {
  return {
    type,
    id,
    payload,
    timestamp: Date.now(),
  };
}

export function parseEnvelope(raw: string | Buffer): ProtocolEnvelope {
  const text = typeof raw === 'string' ? raw : raw.toString('utf8');
  const data = JSON.parse(text) as Partial<ProtocolEnvelope>;

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid envelope: not an object');
  }
  if (typeof data.type !== 'string' || data.type.length === 0) {
    throw new Error('Invalid envelope: missing type');
  }
  if (typeof data.id !== 'string' || data.id.length === 0) {
    throw new Error('Invalid envelope: missing id');
  }
  if (typeof data.timestamp !== 'number') {
    throw new Error('Invalid envelope: missing timestamp');
  }

  return {
    type: data.type,
    id: data.id,
    payload: data.payload,
    timestamp: data.timestamp,
  };
}

export function serializeEnvelope(envelope: ProtocolEnvelope): string {
  return JSON.stringify(envelope);
}
