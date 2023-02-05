const path = require('path');

const CracoLessPlugin = require('craco-less');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const resolve = (dir) => path.resolve(__dirname, dir);

if (process.env.GITHUB_ACTIONS) {
  process.env.CI = 'true';
}

module.exports = {
  webpack: {
    // 别名
    alias: {
      '@': resolve('src'),
      components: resolve('src/components'),
    },
    configure: (webpackConfig, { paths }) => {
      webpackConfig.output.path = path.resolve(__dirname, './dist'); //ts和less编译后的文件
      paths.appBuild = path.resolve(__dirname, './dist'); //public中的文件
      return webpackConfig;
    },
    plugins: [
      !process.env.CI && new SimpleProgressWebpackPlugin(),
      new TerserPlugin({
        terserOptions: {
          ecma: undefined,
          parse: {},
          sourceMap: true,
          warnings: false,
          compress: {
            toplevel: false,
            drop_console: false,
            drop_debugger: false,
            // pure_funcs: ['console.log']
            // pure_funcs:['console.log']
          },
        },
      }),
    ].filter(Boolean),
  },

  babel: {
    presets: [['@babel/preset-react', { runtime: 'automatic', importSource: '@emotion/react' }]],
    plugins: ['@emotion/babel-plugin'],
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#1B67FF',
              '@primary-color-hover': '#1B67FF',
              '@primary-color-active': '#1B67FF',
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
