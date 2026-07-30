import { Command } from 'commander';
import { loginCommand, logoutCommand, registerCommand } from './auth-commands';
import { fetchActiveTunnels, fetchHealth } from './api';
import { getCredential, loadConfig } from './config';
import { runExpose } from './expose-action';
import { printStatus } from './output';

const program = new Command();

program
  .name('devtunnel')
  .description('Securely expose localhost to the internet')
  .version('0.0.1');

program
  .command('register')
  .description('Create a DevTunnel account')
  .option('--server <url>', 'Tunnel server URL')
  .action(async (opts: { server?: string }) => {
    try {
      await registerCommand(opts.server);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('login')
  .description('Authenticate with DevTunnel and store an API key')
  .option('--server <url>', 'Tunnel server URL')
  .action(async (opts: { server?: string }) => {
    try {
      await loginCommand(opts.server);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('logout')
  .description('Clear local credentials')
  .action(async () => {
    try {
      await logoutCommand();
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('expose')
  .description('Expose a local port via a public URL')
  .argument('<port>', 'Local port to expose')
  .option('-s, --subdomain <name>', 'Request a specific subdomain')
  .option('--server <url>', 'Tunnel server URL', process.env.DEVTUNNEL_SERVER_URL)
  .action(async (port: string, opts: { subdomain?: string; server?: string }) => {
    try {
      await runExpose(port, opts);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

// ngrok-style alias: devtunnel http 3000
program
  .command('http')
  .description('Alias for expose — forward HTTP traffic to a local port')
  .argument('<port>', 'Local port to expose')
  .option('-s, --subdomain <name>', 'Request a specific subdomain')
  .option('--server <url>', 'Tunnel server URL', process.env.DEVTUNNEL_SERVER_URL)
  .action(async (port: string, opts: { subdomain?: string; server?: string }) => {
    try {
      await runExpose(port, opts);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('status')
  .description('Show account, server health, and active tunnels')
  .action(async () => {
    try {
      const config = await loadConfig();
      if (!getCredential(config)) {
        console.log('Not logged in. Run: devtunnel login');
        return;
      }

      let serverOk = false;
      let redis: string | undefined;
      try {
        const health = await fetchHealth();
        serverOk = health.status === 'ok' || health.status === 'degraded';
        redis = typeof health.redis === 'string' ? health.redis : undefined;
      } catch {
        serverOk = false;
      }

      let tunnels: Awaited<ReturnType<typeof fetchActiveTunnels>> = [];
      if (serverOk) {
        try {
          tunnels = await fetchActiveTunnels();
        } catch (error) {
          console.error(error instanceof Error ? error.message : String(error));
          process.exitCode = 1;
          return;
        }
      }

      printStatus({
        email: config.email,
        serverUrl: config.serverUrl,
        credentialType: config.apiKey ? 'API key' : 'access token',
        serverOk,
        redis,
        tunnels,
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

// pnpm run forwards a bare "--" which would make Commander treat later flags as operands
const argv = process.argv.filter((arg, index) => index < 2 || arg !== '--');

async function pauseOnWindowsDoubleClick(): Promise<void> {
  // Double-clicking the .exe opens a console that closes immediately after help prints.
  // Keep the window open so the user can read how to use it.
  if (process.platform !== 'win32') return;
  if (argv.length > 2) return;
  console.log('');
  console.log('This is a command-line app (like ngrok). Do not double-click it.');
  console.log('Open Command Prompt / PowerShell / Terminal and run:');
  console.log('');
  console.log('  devtunnel login');
  console.log('  devtunnel expose 3000 --subdomain myapi');
  console.log('  devtunnel status');
  console.log('');
  console.log('Press Enter to close...');
  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => resolve());
  });
}

void (async () => {
  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await pauseOnWindowsDoubleClick();
  }
})();

