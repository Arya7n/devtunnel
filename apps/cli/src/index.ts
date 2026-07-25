#!/usr/bin/env node
import { Command } from 'commander';
import { exposeTunnel } from './tunnel-client';

const program = new Command();

program
  .name('devtunnel')
  .description('Securely expose localhost to the internet')
  .version('0.0.1');

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
      await exposeTunnel({
        localPort,
        subdomain: opts.subdomain,
        serverUrl: opts.server,
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command('login')
  .description('Authenticate with DevTunnel')
  .action(() => {
    console.log('Login — coming in Phase 6.');
  });

program
  .command('status')
  .description('Show active tunnel status')
  .action(() => {
    console.log('Status — not implemented yet. The expose command prints live request logs.');
  });

// pnpm run forwards a bare "--" which would make Commander treat later flags as operands
const argv = process.argv.filter((arg, index) => index < 2 || arg !== '--');
program.parseAsync(argv);
