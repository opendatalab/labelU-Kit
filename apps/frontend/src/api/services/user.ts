import request from '../request';
import type {
  LoginCommand,
  OkRespLoginResponse,
  OkRespLogoutResponse,
  OkRespSignupResponse,
  SignupCommand,
} from '../types';

export async function login(params: LoginCommand): Promise<OkRespLoginResponse> {
  const result = await request.post('/v1/users/login', params);

  localStorage.setItem('token', result.data.token);
  localStorage.setItem('username', params.username);

  return result;
}

export async function logout(): Promise<OkRespLogoutResponse> {
  localStorage.removeItem('token');
  localStorage.removeItem('username');

  return await request.post('/v1/users/logout');
}

export async function signUp(params: SignupCommand): Promise<OkRespSignupResponse> {
  return await request.post('/v1/users/signup', params);
}
