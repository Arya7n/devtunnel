import { input, password } from '@inquirer/prompts';
import { DEFAULT_SERVER_URL } from '@devtunnel/shared';
import { clearConfig, loadConfig, saveConfig } from './config';

interface AuthResponse {
  user: { id: string; email: string; name: string | null };
  accessToken: string;
  refreshToken: string;
}

interface ApiKeyResponse {
  id: string;
  label: string;
  key: string;
}

export async function loginCommand(serverUrl?: string): Promise<void> {
  const existing = await loadConfig();
  const baseUrl = (serverUrl || existing.serverUrl || DEFAULT_SERVER_URL).replace(/\/$/, '');

  const email = await input({ message: 'Email' });
  const pass = await password({ message: 'Password', mask: '*' });

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });

  if (!loginRes.ok) {
    const body = (await loginRes.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Login failed (${loginRes.status})`);
  }

  const auth = (await loginRes.json()) as AuthResponse;

  const keyRes = await fetch(`${baseUrl}/auth/api-keys`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${auth.accessToken}`,
    },
    body: JSON.stringify({ label: 'cli' }),
  });

  if (!keyRes.ok) {
    throw new Error(`Logged in, but failed to create API key (${keyRes.status})`);
  }

  const apiKey = (await keyRes.json()) as ApiKeyResponse;

  await saveConfig({
    serverUrl: baseUrl,
    email: auth.user.email,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    apiKey: apiKey.key,
  });

  console.log(`Logged in as ${auth.user.email}`);
  console.log(`API key stored in ~/.devtunnel/config.json (${apiKey.key.slice(0, 10)}...)`);
}

export async function logoutCommand(): Promise<void> {
  await clearConfig();
  console.log('Logged out. Cleared ~/.devtunnel/config.json');
}

export async function registerCommand(serverUrl?: string): Promise<void> {
  const existing = await loadConfig();
  const baseUrl = (serverUrl || existing.serverUrl || DEFAULT_SERVER_URL).replace(/\/$/, '');

  const email = await input({ message: 'Email' });
  const pass = await password({ message: 'Password (min 8 chars)', mask: '*' });
  const name = await input({ message: 'Name (optional)', default: '' });

  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: pass, name: name || undefined }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Register failed (${res.status})`);
  }

  console.log('Account created. Run `devtunnel login` next.');
}
