import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { DEFAULT_SERVER_URL } from '@devtunnel/shared';

export interface CliConfig {
  serverUrl: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
}

const CONFIG_DIR = join(homedir(), '.devtunnel');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export async function loadConfig(): Promise<CliConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as CliConfig;
    return {
      serverUrl: parsed.serverUrl || DEFAULT_SERVER_URL,
      email: parsed.email,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      apiKey: parsed.apiKey,
    };
  } catch {
    return { serverUrl: DEFAULT_SERVER_URL };
  }
}

export async function saveConfig(config: CliConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

export async function clearConfig(): Promise<void> {
  try {
    await unlink(CONFIG_PATH);
  } catch {
    // ignore missing file
  }
}

export function getCredential(config: CliConfig): string | undefined {
  return config.apiKey || config.accessToken;
}
