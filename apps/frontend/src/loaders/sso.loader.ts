import type { LoaderFunctionArgs } from 'react-router-dom';
import { redirect } from 'react-router-dom';

import { store } from '@/store';

export async function ssoLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  // 过滤掉code和username
  const search = new URLSearchParams(url.search);
  const code = search.get('code');
  search.delete('code');
  search.delete('clientId');

  try {
    if (code) {
      // 处理登陆过来url是否携带code
      await store.dispatch.user.login({ code });

      // 替换basename
      const path = `${location.pathname}?${search.toString()}`;

      return redirect(path);
    } else {
      // 往react-router中注入用户信息
      const data = await store.dispatch.user.getUserInfo();

      return data;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}
