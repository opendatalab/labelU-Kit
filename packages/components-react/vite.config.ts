import { resolve } from 'path';

import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import svgr from 'vite-plugin-svgr';
// import dts from 'vite-plugin-dts';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [peerDepsExternal() as PluginOption, tsconfigPaths(), svgr() /* dts({ rollupTypes: true }) */],
  build: {
    target: 'esnext',
    lib: {
      entry: 'src/index.ts',
      name: 'VideoAnnotationReact',
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
