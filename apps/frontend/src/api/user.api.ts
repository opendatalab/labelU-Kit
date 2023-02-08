import { request } from './request';
import type { LoginResult, LoginParams, LogoutParams, LogoutResult } from '../types/user/login';

/** 登录接口 */
export const apiLogin = (data: LoginParams) => request<LoginResult>('post', '/user/login', data);

/** 登出接口 */
export const apiLogout = (data: LogoutParams) => request<LogoutResult>('post', '/user/logout', data);
