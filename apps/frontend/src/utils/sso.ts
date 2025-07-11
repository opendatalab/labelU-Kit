const sso = {
  clientId: import.meta.env.VITE_SSO_CLIENT_ID,
  auth: `${import.meta.env.VITE_SSO_ORIGIN}/authentication`,
  login: `${import.meta.env.VITE_SSO_ORIGIN}/login`,
  register: `${import.meta.env.VITE_SSO_ORIGIN}/register`,
  origin: import.meta.env.VITE_SSO_ORIGIN,
};

/** 获取 UAA 平台链接 */
export function getUAA(url: string): string {
  return `${url}?redirect=${location.origin}/api/v1/users/token?clientId=${sso.clientId}`;
}

/** 前往sso登录页 */
export function goLogin() {
  debugger;
  window.location.href = getUAA(sso?.login || '');
}

/** 前往sso注册页 */
export function goRegister() {
  window.location.href = getUAA(sso?.register || '');
}

/** 前往sso鉴权 */
export function goAuth() {
  window.location.href = getUAA(sso?.auth || '');
}
/** 个人中心 */
export function goSSO() {
  window.location.href = getUAA(sso?.origin || '');
}
