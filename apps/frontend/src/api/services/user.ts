import * as storage from '@/utils/storage';

import request from '../request';
import type {
  GetUsersApiV1UsersGetParams,
  ListResponseWithMeta,
  OkRespLogoutResponse,
  OkRespSignupResponse,
  OkRespUserInfo,
  SignupCommand,
  UserResponse,
} from '../types';

export async function getUserInfo(): Promise<OkRespUserInfo> {
  const res = await request.get('/v1/users/me');

  storage.set('userid', res.data.id);
  storage.set('username', res.data.username);

  return res;
}

export async function getUsers(params: GetUsersApiV1UsersGetParams): Promise<ListResponseWithMeta<UserResponse>> {
  return await request.get('/v1/users', {
    params,
  });
}

export async function logout(): Promise<OkRespLogoutResponse> {
  storage.set('userid', '');
  storage.set('username', '');

  return await request.get('/v1/users/logout');
}

export async function signUp(params: SignupCommand): Promise<OkRespSignupResponse> {
  return await request.post('/v1/users/signup', params);
}
