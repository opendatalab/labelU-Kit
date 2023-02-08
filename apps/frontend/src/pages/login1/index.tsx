import React from 'react';

import currentStyles from './index.module.scss';
import Login from '../../components/login';
import Constants from '../../constants';
import LogoTitle from '../../components/logoTitle';
const LoginPage = () => {
  return (
    <div className={currentStyles.outerFrame}>
      <LogoTitle />
      <Login turnToSignUp={Constants.urlToRegister} turnToTaskList={Constants.urlToTasks} />
    </div>
  );
};
export default LoginPage;
