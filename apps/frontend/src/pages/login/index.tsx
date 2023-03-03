import Login from '@/components/login';

import currentStyles from './index.module.scss';
import Constants from '../../constants';
import LogoTitle from '../../components/logoTitle';
const LoginPage = () => {
  return (
    <div className={currentStyles.loginWrapper}>
      <LogoTitle />
      <Login turnToSignUp={Constants.urlToRegister} turnToTaskList={Constants.urlToTasks} />
    </div>
  );
};
export default LoginPage;
