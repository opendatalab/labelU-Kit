import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// import path from 'path';
// import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
// const pathResolve = (dir) => {
//   return resolve(__dirname, '.', dir);
// };
// import shimReactPdf from "vite-plugin-shim-react-pdf";
// import reactRefresh from '@vitejs/plugin-react-refresh';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  publicDir: resolve(__dirname, 'public'),
  // proxy: {
  //   '/user': {
  //     target: 'https://www.baidu.com',
  //     changeOrigin: true
  //   }
  // },
  server: {
    port: 3001,
    host: '0.0.0.0'
  },
  plugins: [
    react()
    // createSvgIconsPlugin({
    //   // 指定需要缓存的图标文件夹
    //   iconDirs: [path.resolve(process.cwd(), 'src/img')],
    //   // Specify symbolId format
    //   symbolId: 'icon-[dir]-[name]',

    //   /**
    //    * custom insert position
    //    * @default: body-last
    //    */
    //   inject: 'body-last' | 'body-first',

    //   /**
    //    * custom dom id
    //    * @default: __svg__icons__dom__
    //    */
    //   customDomId: '__svg__icons__dom__'
    // })
  ],
  // resolve: {
  //   alias: [
  //     // { find: '@', replacement: resolve(__dirname, 'src') },
  //     { find: 'components', replacement: resolve(__dirname, 'src/components') }
  //   ]
  // },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
      components: resolve(__dirname, 'src/components/')
    }
  },
  // css: {
  //   sourceMap: true, // 开启 CSS source maps?
  //   loaderOptions: {
  //     less: {
  //       javascriptEnabled: true
  //     }
  //   }
  // }
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true, //注意，这一句是在less对象中，写在外边不起作用
        modifyVars: {
          //在这里进行主题的修改，参考官方配置属性
          // '@primary-color': '#1DA57A'
        }
      }
    }
  }
  // build: {
  //   outDir: '../server/public',
  //   terserOptions: {
  //     compress: {
  //       drop_console: true,
  //       drop_debugger: true
  //     }
  //   },
  //   rollupOptions: {
  //     output: {
  //       chunkFileNames: 'static/js/[name]-[hash].js',
  //       entryFileNames: 'static/js/[name]-[hash].js',
  //       assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
  //       // manualChunks(id) {
  //       //   if (id.includes('node_modules')) {
  //       //     return id.toString().split('node_modules/')[1].split('/')[0].toString();
  //       //   }
  //       // }
  //     }
  //   }
  // }
});
