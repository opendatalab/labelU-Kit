import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

import * as storage from '@/utils/storage';
import { getUserInfo, login } from '@/api/services/user';

export async function rootLoader({ request }: LoaderFunctionArgs) {
  if (window.IS_ONLINE) {
    const url = new URL(request.url);
    // 过滤掉code和username
    const search = new URLSearchParams(url.search);
    const code = search.get('code');

    search.delete('code');
    search.delete('clientId');

    try {
      if (code) {
        // 处理登陆过来url是否携带code
        await login({ code });

        // 替换basename
        const path = `${location.pathname}?${search.toString()}`;

        return redirect(path);
      } else {
        // 往react-router中注入用户信息
        const { data } = await getUserInfo();

        storage.set('username', data.username);

        return data;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  const token = storage.get('token');
  const username = storage.get('username');

  if (!token || !username) {
    return redirect('/login');
  }

  return redirect('/tasks');
}
