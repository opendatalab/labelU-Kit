import axiosProxy from './axiosProxy';
import CommonController from '../utils/common/common';
const { axiosInstance } = axiosProxy;
const login = async function (params: { username: string; password: string }) {
  const res = await axiosInstance({
    url: '/api/v1/users/login',
    method: 'POST',
    data: params,
  });
  // if (res.status !== 200) {
  //     throw new Error('登录出现错误');
  // }
  return res;
};

const signUp = async function (params: { username: string; password: string }) {
  // try {
  const res = await axiosInstance({
    url: '/api/v1/users/signup',
    method: 'POST',
    data: params,
  });
  // if(res.status !== 201){
  //     throw new Error("注册出现错误");
  // }
  return res;
  // }catch (e) {
  //     CommonController.notificationErrorMessage(e, 5);
  // }
};

export { login, signUp };
