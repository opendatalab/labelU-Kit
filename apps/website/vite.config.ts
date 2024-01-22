import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { viteMockServe } from 'vite-plugin-mock';
import tsMonoAlias from 'vite-plugin-ts-mono-alias';
import { visualizer } from 'rollup-plugin-visualizer';

// 开启mock后，proxy将失效
const useMock = process.env.MOCK ? true : false;

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  publicDir: resolve(__dirname, 'public'),
  server: useMock
    ? {}
    : {
        host: true,
        port: 3000,
        proxy: {
          '/api': {
            target: 'https://example.shlab.tech/api',
            changeOrigin: true,
          },
        },
      },

  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },

  plugins: [
    react(),
    svgr(),
    ViteEjsPlugin(),
    viteMockServe({
      mockPath: 'mock',
      enable: useMock,
    }),
    process.env.ANALYZE && visualizer({ open: true, brotliSize: true, filename: './dist/_report.html' }),
    process.env.NODE_ENV !== 'production' && tsMonoAlias(),
  ].filter(Boolean),

  build: {
    minify: true,
    sourcemap: true,
    target: 'es2015',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
    },
  },
});
