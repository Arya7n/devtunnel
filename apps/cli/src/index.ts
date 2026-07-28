#!/usr/bin/env node
import { Command } from 'commander';
import { loginCommand, logoutCommand, registerCommand } from './auth-commands';
import { getCredential, loadConfig } from './config';
import { exposeTunnel } from './tunnel-client';

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
    const localPort = Number(port);
    if (!Number.isInteger(localPort) || localPort < 1 || localPort > 65535) {
      console.error('Port must be an integer between 1 and 65535');
      process.exitCode = 1;
      return;
    }

    try {
      const config = await loadConfig();
      const token = getCredential(config);
      if (!token) {
        console.error('Not logged in. Run: devtunnel login');
        process.exitCode = 1;
        return;
      }

      await exposeTunnel({
        localPort,
        subdomain: opts.subdomain,
        serverUrl: opts.server ?? config.serverUrl,
        token,
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('status')
  .description('Show login / config status')
  .action(async () => {
    const config = await loadConfig();
    if (!getCredential(config)) {
      console.log('Not logged in.');
      return;
    }
    console.log(`Logged in as: ${config.email ?? '(unknown)'}`);
    console.log(`Server: ${config.serverUrl}`);
    console.log(`Credential: ${config.apiKey ? 'API key' : 'access token'}`);
  });

// pnpm run forwards a bare "--" which would make Commander treat later flags as operands
const argv = process.argv.filter((arg, index) => index < 2 || arg !== '--');
program.parseAsync(argv);
