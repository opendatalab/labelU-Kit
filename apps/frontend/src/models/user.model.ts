import { createModel } from '@rematch/core';

import type { UserResp, LoginCommand } from '@/services/types';
import { getUserInfo, login } from '@/services/user';

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

      localStorage.setItem('token', data.token);
    },

    async getUserInfo() {
      const { data } = await getUserInfo();

      dispatch.user.setUser(data);
      localStorage.setItem('username', data.username);

      return data;
    },

    async logout() {
      dispatch.user.setUser({} as UserResp);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    },
  }),
});
