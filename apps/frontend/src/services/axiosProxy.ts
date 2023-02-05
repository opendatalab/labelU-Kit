// import debounce from '@utils/debounce';
// import { message, Modal, notification } from 'antd';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
// import React from 'react';
//
//
// class Axios {
//     private axios?: AxiosInstance;
//     constructor() {
//         this.init();
//     }
//
//     public init() {
//         const instance = axios.create({
//             timeout: 60 * 1000,
//         });
//
//         instance.interceptors.response.use(this.responseSuccessHandler, this.responseErrorHandler);
//         this.axios = instance;
//         return instance;
//     }
//
//     public responseSuccessHandler(response: AxiosResponse): () => any | void {
//         const httpCode = response.status;
//         if ([200, 201, 202, 204].includes(httpCode)) {
//             return response.data;
//         } else {
//             return this.responseErrorHandler(response);
//         }
//     }
//
//     public responseErrorHandler(res: AxiosError | AxiosResponse) {
//         const { response } = res;
//         if (response) {
//             const { status: httpCode, data, config } = response;
//             if (window.commitLog && (httpCode === 400 || httpCode >= 500)) {
//                 // commonController.notificationErrorMessages(response.data, 5)
//                 window.commitLog('request_error', {
//                     message: JSON.stringify(data),
//                     path: config.url,
//                 });
//             }
//
//             // 未登录状态
//             if (httpCode === 401) {
//                 const userInfo = window.g_app._store.getState().userInfo;
//                 const nextPath = isSupplier() ? '/supplier' : '/';
//                 window.g_app._store.dispatch({
//                     type: 'history/recordRedirectHref',
//                 });
//                 if (
//                     ['projectInvitation', 'identifyLink'].some(i =>
//                         window.location.pathname.startsWith(`/${i}`),
//                     )
//                 ) {
//                     return;
//                 }
//
//                 // 单点登陆错误
//                 if (data && data.errorCode === 20004) {
//                     SSONotify(nextPath);
//                 }
//
//                 // 是否已经登陆
//                 if (alreadyLoginIn(userInfo.logInfo)) {
//                     router.push(nextPath);
//                     message.info('请登录');
//                 }
//             }
//
//             // 接口没有权限
//             if (httpCode === 403) {
//                 message.error('不好意思，暂无该页面的权限');
//                 router.push('/403');
//             }
//
//             // React.createElement('span', null, [
//             //   React.createElement('b', { key: 'label' }, '接口地址: '),
//             //   React.createElement(
//             //     'span',
//             //     { style: { textDecoration: 'underline' }, key: 'content' },
//             //     config.url,
//             //   ),
//             // ])
//
//             if (process.env.NODE_ENV === 'development') {
//                 // message.error(React.createElement('span', null, [
//                 //   React.createElement('b', { key: 'label' }, '请求错误，错误代码: '),
//                 //   React.createElement(
//                 //     'span',
//                 //     { style: { textDecoration: 'underline' }, key: 'content' },
//                 //     httpCode,
//                 //   ),
//                 //   React.createElement('b', { key: 'label' }, '接口地址: '),
//                 //   React.createElement(
//                 //     'span',
//                 //     { style: { textDecoration: 'underline' }, key: 'content' },
//                 //     config.url,
//                 //   ),
//                 // ]), 100)
//                 notification.error({
//                     message: `请求错误，错误代码: ${httpCode}`,
//                     description: React.createElement('span', null, [
//                         React.createElement('b', { key: 'label' }, '接口地址: '),
//                         React.createElement(
//                             'span',
//                             { style: { textDecoration: 'underline' }, key: 'content' },
//                             config.url,
//                         ),
//                     ]),
//                     top: 60,
//                 });
//             }
//         }
//
//         return Promise.reject(response?.data);
//     }
// }

// const axiosRequest = new Axios().init();
// export default axiosRequest;

const responseSuccessHandler = (response: any) => {
  return response;
};

const responseFailedHandler = (res: any) => {
  // const httpCode = response.status;
  // if ([200, 201, 202, 204].includes(httpCode)) {
  // return response.data;
  const { response } = res;
  return Promise.reject(response?.data);
  // } else {
  //     return this.responseErrorHandler(response);
  // }
};

const authorizationBearerSuccess = (config: any) => {
  const token = localStorage.token;
  if (token) {
    config.headers.Authorization = localStorage.token;
  }
  return config;
};

const authorizationBearerFailed = (error: any) => {
  return Promise.reject(error);
};

const axiosProxy: { _instance: any; axiosInstance: AxiosInstance } = {
  _instance: undefined,
  get axiosInstance() {
    if (!this._instance) {
      this._instance = axios.create({
        timeout: 60 * 1000,
      });
      this._instance.interceptors.request.use(authorizationBearerSuccess, authorizationBearerFailed);
      this._instance.interceptors.response.use(responseSuccessHandler, responseFailedHandler);
    }
    return this._instance;
  },
};
export default axiosProxy;
