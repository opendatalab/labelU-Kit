import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import Navigate from '@/components/Navigate';

import currentStyles from './index.module.scss';

const MainLayout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    const _username = localStorage.getItem('username');

    if (!token || !_username) {
      navigate('/login');
    }
  }, [navigate]);

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
