import { resolve } from 'path';

import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [peerDepsExternal() as PluginOption, tsconfigPaths()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SiNanFormatter',
      formats: ['es', 'umd'],
      fileName: 'index',
    },
  },
  resolve: {
    alias: {
      '@/': resolve(__dirname, 'src'),
    },
  },
});
