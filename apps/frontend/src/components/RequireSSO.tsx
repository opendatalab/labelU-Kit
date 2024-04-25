import { useRouteLoaderData } from 'react-router-dom';

import { goAuth } from '@/utils/sso';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const auth = useRouteLoaderData('root');

  if (!auth) {
    goAuth();

    return null;
  }

  return children;
}
