import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import currentStyles from './index.module.scss';
import Navigate from '../../components/navigate/index';

const Homepage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | undefined>(undefined);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const _username = localStorage.getItem('username');
    if (token && _username) {
      setUsername(_username);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className={currentStyles.main}>
      {/* @ts-ignore */}
      <Navigate username={username} />
      <div className={currentStyles.content}>
        <Outlet />
      </div>
    </div>
  );
};
export default Homepage;
