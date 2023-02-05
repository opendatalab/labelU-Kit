import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import constants from '../../../constants';
const RootGuard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.pathname === '/') {
      navigate(constants.urlToTasks);
    }
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      navigate('/tasks');
    } else {
      navigate('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Outlet />;
};
export default RootGuard;
