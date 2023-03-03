// @ts-ignore
/* eslint-disable */
import request from '@/services/request';

/** Login User login, get an access token for future requests POST /api/v1/users/login */
export async function loginApiV1UsersLoginPost(
  body: Api.LoginCommand,
  options?: { [key: string]: any },
) {
  return request<Api.OkRespLoginResponse_>('/api/v1/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Logout User logout POST /api/v1/users/logout */
export async function logoutApiV1UsersLogoutPost(options?: { [key: string]: any }) {
  return request<Api.OkRespLogoutResponse_>('/api/v1/users/logout', {
    method: 'POST',
    ...(options || {}),
  });
}

/** Signup User signup a account POST /api/v1/users/signup */
export async function signupApiV1UsersSignupPost(
  body: Api.SignupCommand,
  options?: { [key: string]: any },
) {
  return request<Api.OkRespSignupResponse_>('/api/v1/users/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
