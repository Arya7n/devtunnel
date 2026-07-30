#!/usr/bin/env node
/**
 * Build a standalone Windows/macOS/Linux executable using Node.js SEA + postject.
 * Output: apps/cli/release/devtunnel(.exe)
 *
 * Why SEA instead of pkg: no downloading Node source / remote pkg cache.
 */
const { spawnSync } = require('node:child_process');
const {
  mkdirSync,
  existsSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  rmSync,
} = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const distJs = join(root, 'dist', 'index.js');
const releaseDir = join(root, 'release');
const isWin = process.platform === 'win32';
const outName = isWin ? 'devtunnel.exe' : 'devtunnel';
const outPath = join(releaseDir, outName);
const seaMain = join(releaseDir, 'sea-main.js');
const seaConfig = join(releaseDir, 'sea-config.json');
const seaBlob = join(releaseDir, 'sea-prep.blob');

if (!existsSync(distJs)) {
  console.error('Missing dist/index.js. Run: pnpm --filter @devtunnel/cli build');
  process.exit(1);
}

mkdirSync(releaseDir, { recursive: true });

// SEA entry: strip shebang (SEA scripts must be plain JS)
const bundled = readFileSync(distJs, 'utf8').replace(/^#!.*\r?\n/, '');
writeFileSync(seaMain, bundled, 'utf8');

writeFileSync(
  seaConfig,
  JSON.stringify(
    {
      main: seaMain,
      output: seaBlob,
      disableExperimentalSEAWarning: true,
      useSnapshot: false,
      useCodeCache: true,
    },
    null,
    2,
  ),
  'utf8',
);

console.log('Generating SEA blob...');
const seaResult = spawnSync(process.execPath, ['--experimental-sea-config', seaConfig], {
  stdio: 'inherit',
  cwd: root,
});
if (seaResult.status !== 0) {
  process.exit(seaResult.status ?? 1);
}

console.log(`Copying Node binary → ${outPath}`);
const stagingPath = join(releaseDir, isWin ? 'devtunnel.new.exe' : 'devtunnel.new');
if (existsSync(stagingPath)) {
  rmSync(stagingPath, { force: true });
}
copyFileSync(process.execPath, stagingPath);

if (isWin) {
  // Best-effort: unsigned binaries inject more reliably
  const signtool = spawnSync('signtool', ['remove', '/s', stagingPath], {
    stdio: 'ignore',
    shell: true,
  });
  if (signtool.status === 0) {
    console.log('Removed Authenticode signature from Node binary');
  }
}

console.log('Injecting SEA blob with postject...');
const postjectArgs = [
  '--yes',
  'postject',
  stagingPath,
  'NODE_SEA_BLOB',
  seaBlob,
  '--sentinel-fuse',
  'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
];
if (process.platform === 'darwin') {
  postjectArgs.push('--macho-segment-name', 'NODE_SEA');
}

const postject = spawnSync('npx', postjectArgs, {
  stdio: 'inherit',
  shell: true,
  cwd: root,
});
if (postject.status !== 0) {
  process.exit(postject.status ?? 1);
}

try {
  if (existsSync(outPath)) {
    rmSync(outPath, { force: true });
  }
  copyFileSync(stagingPath, outPath);
  rmSync(stagingPath, { force: true });
} catch (error) {
  console.warn(
    `Could not replace ${outPath} (file may be open). New build is at: ${stagingPath}`,
  );
  console.warn(error instanceof Error ? error.message : String(error));
}

if (!isWin) {
  chmodSync(outPath, 0o755);
}

writeFileSync(
  join(releaseDir, 'Open in Terminal.bat'),
  [
    '@echo off',
    'title DevTunnel CLI',
    'cd /d "%~dp0"',
    'echo.',
    'echo DevTunnel CLI — run commands in this window',
    'echo.',
    'echo   Examples:',
    'echo     devtunnel.exe status',
    'echo     devtunnel.exe login',
    'echo     devtunnel.exe expose 3000 --subdomain myapi',
    'echo.',
    'echo First make sure the DevTunnel server is running on http://localhost:4000',
    'echo.',
    'cmd /k',
    '',
  ].join('\r\n'),
  'utf8',
);

writeFileSync(
  join(releaseDir, 'install.ps1'),
  [
    '# Install DevTunnel CLI for the current user',
    '$ErrorActionPreference = "Stop"',
    '$dest = Join-Path $env:LOCALAPPDATA "DevTunnel"',
    'New-Item -ItemType Directory -Force -Path $dest | Out-Null',
    'Copy-Item -Force (Join-Path $PSScriptRoot "devtunnel.exe") (Join-Path $dest "devtunnel.exe")',
    'Copy-Item -Force (Join-Path $PSScriptRoot "Open in Terminal.bat") (Join-Path $dest "Open in Terminal.bat") -ErrorAction SilentlyContinue',
    '',
    '$pathEntry = $dest',
    '$userPath = [Environment]::GetEnvironmentVariable("Path", "User")',
    'if ($userPath -notlike "*$pathEntry*") {',
    '  [Environment]::SetEnvironmentVariable("Path", "$userPath;$pathEntry", "User")',
    '  Write-Host "Added $pathEntry to your User PATH."',
    '  Write-Host "Open a NEW terminal, then run: devtunnel --version"',
    '} else {',
    '  Write-Host "DevTunnel already on PATH."',
    '}',
    'Write-Host "Installed: $dest\\devtunnel.exe"',
    'Write-Host ""',
    'Write-Host "Do NOT double-click the exe. Use a terminal:"',
    'Write-Host "  devtunnel status"',
    'Write-Host "  OR open: $dest\\Open in Terminal.bat"',
    '',
  ].join('\n'),
  'utf8',
);

writeFileSync(
  join(releaseDir, 'README.txt'),
  [
    'DevTunnel CLI (standalone executable)',
    '=====================================',
    '',
    'This is a single-file installable CLI (similar to ngrok).',
    '',
    'Windows install:',
    '  powershell -ExecutionPolicy Bypass -File install.ps1',
    '  # then open a NEW terminal',
    '  devtunnel --version',
    '  devtunnel login',
    '  devtunnel expose 3000 --subdomain myapi',
    '',
    'Or run directly:',
    '  .\\devtunnel.exe --help',
    '',
    'Default server: http://localhost:4000',
    'Override:       set DEVTUNNEL_SERVER_URL=https://your-server',
    'Config file:    %USERPROFILE%\\.devtunnel\\config.json',
    '',
    'Note: the CLI still needs a running DevTunnel server.',
    '',
  ].join('\n'),
  'utf8',
);

// cleanup intermediates (keep exe + install helpers)
try {
  rmSync(seaMain, { force: true });
  rmSync(seaConfig, { force: true });
  rmSync(seaBlob, { force: true });
} catch {
  // ignore
}

console.log('');
console.log(`Done: ${outPath}`);
if (isWin) {
  console.log('Install: powershell -ExecutionPolicy Bypass -File apps/cli/release/install.ps1');
}
