/**
 * 代理跨域配置
 */
const proxy = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    // 一般使用
    // proxy('http://localhost:2000')

    proxy('/api', {
      target: `http://localhost:${process.env.PORT}/api`,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '',
      },
    }),
  );
  app.use(
    proxy('/v1', {
      target: `http://localhost:8999/v1`,
      changeOrigin: true,
      pathRewrite: {
        '^/v1': '',
      },
    }),
  );
};
