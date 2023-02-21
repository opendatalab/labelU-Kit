import { resolve } from 'path';

import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [peerDepsExternal() as PluginOption, tsconfigPaths(), svgr()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
  },
  resolve: {
    alias: {
      '@/': resolve(__dirname, 'src'),
    },
  },
});
