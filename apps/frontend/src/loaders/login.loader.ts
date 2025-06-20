import { goAuth } from '@/utils/sso';

export async function loginLoader() {
  if (window.IS_ONLINE) {
    goAuth();

    return Promise.resolve();
  }

  return null;
}
