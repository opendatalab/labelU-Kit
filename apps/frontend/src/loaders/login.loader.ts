import { redirect } from 'react-router';

import { goAuth } from '@/utils/sso';
import * as storage from '@/utils/storage';

export async function loginLoader() {
  if (storage.get('token')) {
    return redirect('/tasks');
  }

  if (window.IS_ONLINE) {
    goAuth();

    return Promise.resolve();
  }

  return null;
}
