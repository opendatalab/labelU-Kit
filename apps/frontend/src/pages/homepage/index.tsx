import React, { useEffect, useState } from 'react';
import currentStyles from './index.module.scss';
import Navigate from '../../components/navigate/index';
import { Outlet, useNavigate } from 'react-router-dom';
import constants from '../../constants';
const Homepage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(undefined);
  useEffect(() => {
    if (window.location.pathname === '/') {
      navigate(constants.urlToTasks);
    }
    let token = localStorage.getItem('token');
    let username = localStorage.getItem('username');
    if (token && username) {
      navigate('/tasks');
    } else {
      navigate('/login');
    }
  }, []);
  return (
    <div className={currentStyles.outerFrame}>
      <Navigate username={username} />
      <div className={currentStyles.content}>
        <Outlet />
      </div>
      {/*<TaskList />*/}
    </div>
  );
};
export default Homepage;
