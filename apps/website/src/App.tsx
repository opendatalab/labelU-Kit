import { App as AntApp } from 'antd';

import RouterContainer from '@/components/RouterContainer';

import routes from './routes';

export default function App() {
  return (
    <AntApp>
      <RouterContainer routes={routes} />
    </AntApp>
  );
}
