import { Input, Form } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import intl from 'react-intl-universal';

import type { Dispatch } from '@/store';

import LogoTitle from '../../components/logoTitle';
import styles from './index.module.scss';
import enUS1 from '../../locales/en-US';
import zhCN1 from '../../locales/zh-CN';

const LoginPage = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();

  const handleLogin = async (values: any) => {
    dispatch.user.login(values).then(() => {
      navigate('/');
    });
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
    <div className={styles.loginWrapper}>
      <LogoTitle />
      <Form className={styles.loginForm} form={form} onFinish={handleLogin}>
        <div className={styles.title}>{intl.get('login123')}</div>
        <div className={styles.email_m}>
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请填写邮箱' },
              { type: 'email', message: '请填写正确的邮箱格式' },
            ]}
          >
            <Input
              placeholder={intl.get('email')}
              prefix={<img src="/src/icons/email.svg" alt="" />}
              className={'email'}
              onPressEnter={form.submit}
            />
          </Form.Item>
        </div>

        <div className={styles.email_m}>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请填写密码' },
              {
                pattern: /^\S+$/,
                message: '密码不能包含空格',
              },
            ]}
          >
            <Input.Password
              placeholder={intl.get('password')}
              prefix={<img src="/src/icons/password.svg" alt="" />}
              visibilityToggle={false}
              onPressEnter={form.submit}
            />
          </Form.Item>
        </div>

        <div className={styles.loginButton} onClick={form.submit}>
          {intl.get('login123')}
        </div>
        <div className={styles.signUpButton}>
          <Link to="/register">{intl.get('signUp')}</Link>
        </div>
      </Form>
    </div>
  );
};
export default LoginPage;
