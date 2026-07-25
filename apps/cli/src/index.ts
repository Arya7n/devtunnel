#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('devtunnel')
  .description('Securely expose localhost to the internet')
  .version('0.0.1');

program
  .command('expose')
  .description('Expose a local port via a public HTTPS URL')
  .argument('<port>', 'Local port to expose')
  .option('-s, --subdomain <name>', 'Request a specific subdomain')
  .action((port: string) => {
    console.log(`DevTunnel CLI scaffold — expose ${port} coming in Phase 3.`);
    console.log('Run: pnpm --filter @devtunnel/cli build');
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
    console.log('Status — coming in Phase 3.');
  });

program.parse();
