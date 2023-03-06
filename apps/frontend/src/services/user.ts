import request from './request';
import type {
  LoginCommand,
  OkRespLoginResponse,
  OkRespLogoutResponse,
  OkRespSignupResponse,
  SignupCommand,
} from './types';

export async function login(params: LoginCommand): Promise<OkRespLoginResponse> {
  return await request.post('/v1/users/login', params);
}

export async function logout(): Promise<OkRespLogoutResponse> {
  return await request.post('/v1/users/logout');
}

export async function signUp(params: SignupCommand): Promise<OkRespSignupResponse> {
  return await request.post('/v1/users/signup', params);
}
