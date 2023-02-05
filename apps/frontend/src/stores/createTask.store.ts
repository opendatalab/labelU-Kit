import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { Role } from '../types/user/login';
import type { Locale, UserState } from '../types/user/user';
import { getGlobalState } from '../utils/getGloabal';

const initialState = {
  ...getGlobalState(),
  noticeCount: 0,
  locale: (localStorage.getItem('locale')! || 'zh_CN') as Locale,
  newUser: JSON.parse(localStorage.getItem('newUser')!) ?? true,
  logged: localStorage.getItem('t') ? true : false,
  menuList: [],
  username: localStorage.getItem('username') || '',
  role: (localStorage.getItem('username') || '') as Role,
};

const userSlice = createSlice({
  name: 'createTask',
  initialState,
  reducers: {
    setUserItem(state: any, action: PayloadAction<Partial<UserState>>) {
      const { username } = action.payload;

      if (username !== state.username) {
        localStorage.setItem('username', action.payload.username || '');
      }

      Object.assign(state, action.payload);
    },
  },
});

export const { setUserItem } = userSlice.actions;

export default userSlice.reducer;

// export const loginAsync = createAsyncAction<LoginParams, boolean>(payload => {
//     return async (dispatch, getState) => {
//         const { result, status } = await apiLogin(payload);
//         if (status) {
//             localStorage.setItem('t', result.token);
//             localStorage.setItem('username', result.username);
//             dispatch(
//                 setUserItem({
//                     logged: true,
//                     username: result.username
//                 })
//             );
//             return true;
//         }
//         return false;
//     };
// });

// export const logoutAsync = () => {
//     return async (dispatch: Dispatch) => {
//         const { status } = await apiLogout({ token: localStorage.getItem('t')! });
//         if (status) {
//             localStorage.clear();
//             dispatch(
//                 setUserItem({
//                     logged: false
//                 })
//             );
//             return true;
//         }
//         return false;
//     };
// };
