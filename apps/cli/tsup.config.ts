import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  // Bundle everything so the standalone exe has no node_modules dependency
  noExternal: [/.*/],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
