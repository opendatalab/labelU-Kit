import { message as $message } from 'antd';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

const axiosInstance = axios.create({
  timeout: 6000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (config) => {
    if (config?.data?.message) {
      // $message.success(config.data.message)
    }
    return config?.data;
  },
  (error) => {
    // if needs to navigate to login page when request exception
    // history.replace('/login');
    let errorMessage = '系统异常';
    if (error?.message?.includes('Network Error')) {
      errorMessage = '网络错误，请检查您的网络';
    } else {
      errorMessage = error?.message;
    }

    if (error.message) {
      $message.error(errorMessage);
    }

    return {
      status: false,
      message: errorMessage,
      result: null,
    };
  },
);

export interface Response<T = any> {
  status: string;
  message: string;
  result: T;
}

type Method = 'get' | 'post';

export type MyResponse<T = any> = Promise<Response<T>>;

/**
 *
 * @param method - request methods
 * @param url - request url
 * @param data - request data or params
 */
export const request = <T = any>(
  method: Method,
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): MyResponse<T> => {
  // const prefix = '/api'
  const prefix = '';
  const newUrl = prefix + url;
  if (method === 'post') {
    return axiosInstance.post(newUrl, data, config);
  } else {
    return axiosInstance.get(newUrl, {
      params: data,
      ...config,
    });
  }
};
