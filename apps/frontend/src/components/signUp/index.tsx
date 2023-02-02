import React, { useState } from 'react';
import currentStyles from '../signUp/index.module.scss';
import { Input } from 'antd';
import { Link } from 'react-router-dom';
import { IdcardOutlined, LockOutlined } from '@ant-design/icons';
import CommonController from '../../utils/common/common';
import { login as loginService, signUp } from '../../services/general';
import { useNavigate } from 'react-router-dom';
import intl from 'react-intl-universal';
import enUS1 from '../../locales/en-US';
import zhCN1 from '../../locales/zh-CN';
const SignUp = (props: any) => {
  const { turnToLogin } = props;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const navigate = useNavigate();
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
  const changeEmail = (event: any) => {
    let targetValue = event.target.value;
    let isNull = CommonController.isInputValueNull(event);
    if (!isNull) {
      setUsername(targetValue);
    }
  };
  const changePassword = (event: any) => {
    let targetValue = event.target.value;
    let isNull = CommonController.isInputValueNull(event);
    if (!isNull) {
      setPassword(targetValue);
    }
  };
  const checkRepeatPassword = () => {
    let result = true;
    if (password !== repeatPassword) {
      result = false;
      CommonController.notificationErrorMessage({ msg: '两次输入的密码不一致' }, 1);
    }
    return result;
  };

  const register = async function () {
    try {
      let hasUndefined = CommonController.checkObjectHasUndefined({
        username,
        password,
        repeatPassword,
      });
      if (hasUndefined.tag) {
        CommonController.notificationErrorMessage({ msg: hasUndefined.key }, 2);
        return;
      }
      let checkUsername = CommonController.checkEmail(undefined, username);
      if (!checkUsername) {
        return;
      }
      let checkPassword = CommonController.checkPassword(undefined, password);
      if (!checkPassword) {
        return;
      }
      let checkRepeatPassword = password === repeatPassword;
      if (!checkRepeatPassword) {
        CommonController.notificationErrorMessage({ msg: '两次输入的密码不一致' }, 1);
        return;
      }
      let res = await signUp({
        username,
        password,
      });
      // @ts-ignore
      if (res.status !== 201) {
        CommonController.notificationErrorMessage(res, 2);
        return;
      }
      CommonController.notificationSuccessMessage({ message: '注册成功' }, 1);
      // localStorage.setItem('token', token);
      navigate(turnToLogin);
    } catch (error) {
      CommonController.notificationErrorMessage(error, 1);
    }

    // try {
    //     let res = await signUp({username,password})
    // }catch{
    //
    // }
  };
  const changeRepeatPassword = (event: any, repeatPassword?: any) => {
    let targetValue = event ? event.target.value : repeatPassword;
    let isNull = CommonController.isInputValueNull(event);
    if (!isNull) {
      setRepeatPassword(targetValue);
    }
  };

  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.title}>{intl.get('signUp')}</div>
      <div className={currentStyles.email_m}>
        <Input
          // placeholder = '请输入邮箱'
          placeholder={intl.get('requestEmail')}
          prefix={
            // <IdcardOutlined/>
            <img src="/src/icons/email.svg" alt="" />
          }
          onBlur={CommonController.debounce(CommonController.checkEmail, 500)}
          onChange={changeEmail}
          className={'email'}
        />
      </div>

      <div className={currentStyles.email_m}>
        <Input.Password
          // placeholder = '请输入不少于6位数的密码'
          placeholder={intl.get('requestPassword')}
          onChange={changePassword}
          onBlur={CommonController.debounce(CommonController.checkPassword, 500)}
          prefix={
            // <LockOutlined/>
            <img src="/src/icons/password.svg" alt="" />
          }
          visibilityToggle={false}
        />
      </div>

      <div className={currentStyles.email_m}>
        <Input.Password
          // placeholder = '请再次输入不少于6位数的密码'
          placeholder={intl.get('requestRepeatPassword')}
          onChange={changeRepeatPassword}
          onBlur={CommonController.debounce(checkRepeatPassword, 500)}
          visibilityToggle={false}
          prefix={
            // <LockOutlined/>
            <img src="/src/icons/password.svg" alt="" />
          }
        />
      </div>

      <div className={currentStyles.loginButton} onClick={register}>
        {intl.get('signUpButton')}
      </div>
      <div className={currentStyles.signUpButton}>
        {intl.get('hasAccount')}？<Link to={'/'}>{intl.get('login123')}</Link>
      </div>
    </div>
  );
};
export default SignUp;
