import request from './request';
import type {
  LoginCommand,
  OkRespLoginResponse,
  OkRespLogoutResponse,
  OkRespSignupResponse,
  OkRespUserInfo,
  SignupCommand,
} from './types';

export async function login(params: LoginCommand): Promise<OkRespLoginResponse> {
  return await request.post(`/v1/users/token?code=${params.code}`);
}

export async function getUserInfo(): Promise<OkRespUserInfo> {
  return await request.post('/v1/users/me');
}

export async function logout(): Promise<OkRespLogoutResponse> {
  return await request.post('/v1/users/logout');
}

export async function signUp(params: SignupCommand): Promise<OkRespSignupResponse> {
  return await request.post('/v1/users/signup', params);
}
