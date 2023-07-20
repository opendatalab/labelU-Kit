import { Outlet } from 'react-router-dom';

import Navigate from '@/components/Navigate';

import currentStyles from './index.module.scss';

const MainLayout = () => {
  return (
    <div className={currentStyles.main}>
      <Navigate />
      <div className={currentStyles.content}>
        <Outlet />
      </div>
    </div>
  );
};
export default MainLayout;
