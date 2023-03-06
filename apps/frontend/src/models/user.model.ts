import { createModel } from '@rematch/core';

import type { UserResp, LoginCommand } from '@/services/types';
import { login, logout } from '@/services/user';

import type { RootModel } from './index';

export const user = createModel<RootModel>()({
  state: {
    username: localStorage.getItem('username'),
    locale: localStorage.getItem('locale') || 'zh_CN',
  } as UserResp,

  reducers: {
    setUser: (state, payload: UserResp) => {
      return {
        ...state,
        user: payload,
      };
    },
  },

  effects: (dispatch) => ({
    async login(params: LoginCommand) {
      const { data } = await login(params);

      dispatch.user.setUser(params);
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', params.username);
    },

    async logout() {
      await logout();

      dispatch.user.setUser({} as UserResp);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    },
  }),
});
