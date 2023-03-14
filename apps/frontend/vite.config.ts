import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { viteMockServe } from 'vite-plugin-mock';
import svgr from 'vite-plugin-svgr';
import tsMonoAlias from 'vite-plugin-ts-mono-alias';
import vitePluginImp from 'vite-plugin-imp';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  publicDir: resolve(__dirname, 'public'),
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },

  plugins: [
    react(),
    svgr(),
    ViteEjsPlugin(),
    !process.env.DIST && process.env.NODE_ENV !== 'production' && tsMonoAlias({}),
    vitePluginImp({
      libList: [
        {
          libName: 'antd',
          style: (name) => `antd/es/${name}/style/index.js`,
        },
      ],
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true, //注意，这一句是在less对象中，写在外边不起作用
        modifyVars: {
          '@primary-color': '#0D53DE',
          '@primary-color-hover': '#3477EB',
          '@primary-color-active': '#0238B8',
        },
      },
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
