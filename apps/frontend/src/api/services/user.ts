import request from '../request';
import type {
  LoginCommand,
  OkRespLoginResponse,
  OkRespLogoutResponse,
  OkRespSignupResponse,
  OkRespUserInfo,
  SignupCommand,
} from '../types';

interface SSOLoginParams {
  code: string;
}

export async function login(params: LoginCommand | SSOLoginParams): Promise<OkRespLoginResponse> {
  const url = window.IS_ONLINE ? `/v1/users/token?code=${(params as SSOLoginParams).code}` : '/v1/users/login';

  const result = await request.post(url, params);

  localStorage.setItem('token', result.data.token);

  if (window.IS_ONLINE) {
    // TODO
  } else {
    localStorage.setItem('username', (params as LoginCommand).username!);
  }

  return result;
}

export async function getUserInfo(): Promise<OkRespUserInfo> {
  return await request.post('/v1/users/me');
}

export async function logout(): Promise<OkRespLogoutResponse> {
  localStorage.removeItem('token');
  localStorage.removeItem('username');

  return await request.post('/v1/users/logout');
}

export async function signUp(params: SignupCommand): Promise<OkRespSignupResponse> {
  return await request.post('/v1/users/signup', params);
}
