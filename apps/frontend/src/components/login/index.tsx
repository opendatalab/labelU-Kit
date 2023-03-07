import { useState } from 'react';
import { Input } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import intl from 'react-intl-universal';

import type { Dispatch } from '@/store';

import CommonController from '../../utils/common/common';
import commonStyles from '../../utils/common/common.module.scss';
import currentStyles from './index.module.scss';
import enUS1 from '../../locales/en-US';
import zhCN1 from '../../locales/zh-CN';
const Login = (props: any) => {
  const { turnToSignUp, turnToTaskList } = props;

  const dispatch = useDispatch<Dispatch>();
  // REVIEW: checkMessage 没有设置值的地方
  const [checkMessage] = useState<any>({});
  const [email, setEmail] = useState<any>(null);
  const [password, setPassword] = useState<any>(null);
  const navigate = useNavigate();
  const changeEmail = (event: any) => {
    let target = event.target.value;
    if (target !== undefined) {
      target = target.trim();
      setEmail(target);
    }
  };
  const changePassword = (event: any) => {
    let target = event.target.value;
    if (target !== undefined) {
      target = target.trim();
      setPassword(target);
    }
  };
  const loginController = async function () {
    try {
      const hasUndefined = CommonController.checkObjectHasUndefined({
        username: email,
        password,
      });
      if (hasUndefined.tag) {
        CommonController.notificationErrorMessage({ msg: hasUndefined.key }, 5);
        return;
      }
      const checkUsername = CommonController.checkEmail(undefined, email);
      if (!checkUsername) {
        return;
      }
      const checkPassword = CommonController.checkPassword(undefined, password);
      if (!checkPassword) {
        return;
      }

      await dispatch.user.login({
        username: email,
        password,
      });

      navigate(turnToTaskList);
    } catch (error) {
      CommonController.notificationErrorMessage(error, 1);
    }
  };

  if (navigator.language.indexOf('zh-CN') > -1) {
    intl.init({
      currentLocale: 'zh-CN',
      locales: {
        'en-US': enUS1,
        'zh-CN': zhCN1,
      },
    });
  } else {
    intl.init({
      currentLocale: 'en-US',
      locales: {
        'en-US': enUS1,
        'zh-CN': zhCN1,
      },
    });
  }

  return (
    <div className={currentStyles.loginForm}>
      <div className={currentStyles.title}>{intl.get('login123')}</div>
      <div className={currentStyles.email_m}>
        <Input
          placeholder={intl.get('email')}
          onChange={changeEmail}
          prefix={
            // <IdcardOutlined/>
            <img src="/src/icons/email.svg" alt="" />
          }
          className={'email'}
          onBlur={CommonController.debounce(CommonController.checkEmail, 500)}
          // onPressEnter = {CommonController.debounce(CommonController.checkEmail, 1000)}
        />
        <div className={commonStyles.loginAndSignUpNotice}>{checkMessage.email}</div>
      </div>

      <div className={currentStyles.email_m}>
        <Input.Password
          placeholder={intl.get('password')}
          onChange={changePassword}
          prefix={
            // <LockOutlined/>
            <img src="/src/icons/password.svg" alt="" />
          }
          visibilityToggle={false}
          onBlur={CommonController.debounce(CommonController.checkPassword, 500)}
        />
        <div className={commonStyles.loginAndSignUpNotice}>{checkMessage.password}</div>
      </div>

      <div className={currentStyles.loginButton} onClick={CommonController.debounce(loginController, 500)}>
        {intl.get('login123')}
      </div>
      <div className={currentStyles.signUpButton}>
        <Link to={turnToSignUp}>{intl.get('signUp')}</Link>
      </div>
    </div>
  );
};
export default Login;
