import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';

import Navigate from '@/components/Navigate';

import currentStyles from './index.module.scss';

const MainLayout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 标注配置预览不需要导航头部
  const isPreview = searchParams.get('noSave');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const _username = localStorage.getItem('username');

    if (!token || !_username) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className={currentStyles.main}>
      {!isPreview && <Navigate />}
      <div className={currentStyles.content}>
        <Outlet />
      </div>
    </div>
  );
};
export default MainLayout;
