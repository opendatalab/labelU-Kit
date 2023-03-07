import React from 'react';

import currentStyles from './index.module.scss';
import SignUp from '../../components/signUp';
import Constants from '../../constants';
import LogoTitle from '../../components/logoTitle';
const SignUpPage = () => {
  return (
    <div className={currentStyles.signUpWrapper}>
      <LogoTitle />
      <SignUp turnToLogin={Constants.urlToLogin} />
    </div>
  );
};
export default SignUpPage;
