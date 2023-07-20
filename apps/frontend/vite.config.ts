import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsMonoAlias from 'vite-plugin-ts-mono-alias';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  publicDir: resolve(__dirname, 'public'),
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://10.1.96.84:8000',
        changeOrigin: true,
      },
    },
  },
  envDir: resolve(__dirname, 'env'),

  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },

  plugins: [
    react(),
    svgr(),
    ViteEjsPlugin(),
    !process.env.DIST && process.env.NODE_ENV !== 'production' && tsMonoAlias({}),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
    },
  },
  build: {
    target: 'es2015',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
  },
});
