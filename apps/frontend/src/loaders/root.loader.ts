import { redirect } from 'react-router';

export async function rootLoader() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  if (!token || !username) {
    return redirect('/login');
  }

  return redirect('/tasks');
}
