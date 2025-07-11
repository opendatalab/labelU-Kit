import { getUserInfo } from '@/api/services/user';

export async function rootLoader() {
  try {
    const { data } = await getUserInfo();

    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}
