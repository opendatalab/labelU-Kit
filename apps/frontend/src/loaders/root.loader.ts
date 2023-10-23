import { redirect } from 'react-router';

import * as storage from '@/utils/storage';

export async function rootLoader() {
  const token = storage.get('token');
  const username = storage.get('username');

  if (!token || !username) {
    return redirect('/login');
  }

  return redirect('/tasks');
}
