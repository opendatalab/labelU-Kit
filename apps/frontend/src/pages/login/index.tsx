import type { FormProps } from 'antd';
import { Input, Form } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '@/api/services/user';
import FlexLayout from '@/layouts/FlexLayout';
import { ReactComponent as EmailIcon } from '@/assets/svg/email.svg';
import { ReactComponent as PasswordIcon } from '@/assets/svg/password.svg';

import LogoTitle from '../../components/logoTitle';
import { ButtonWrapper, FormWrapper, LoginWrapper } from './style';

interface FormValues {
  username: string;
  password: string;
}

const LoginPage = () => {
  const [form] = Form.useForm<FormValues>();
  const navigate = useNavigate();

  const handleLogin: FormProps<FormValues>['onFinish'] = async (values) => {
    login(values).then(() => {
      navigate('/');
    });
  };

  return (
    <LoginWrapper direction="column" justify="center" items="center">
      <LogoTitle />
      <FormWrapper gap=".5rem" flex="column">
        <Form<FormValues> form={form} onFinish={handleLogin}>
          <FlexLayout direction="column">
            <h1>登录</h1>
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请填写邮箱' },
                { type: 'email', message: '请填写正确的邮箱格式' },
              ]}
            >
              <Input placeholder="邮箱" prefix={<EmailIcon />} onPressEnter={form.submit} />
            </Form.Item>
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
                placeholder="密码"
                prefix={<PasswordIcon />}
                visibilityToggle={false}
                onPressEnter={form.submit}
              />
            </Form.Item>
            <Form.Item>
              <ButtonWrapper block type="primary" onClick={form.submit}>
                登录
              </ButtonWrapper>
            </Form.Item>
          </FlexLayout>
        </Form>
        <FlexLayout justify="flex-end">
          <Link to="/register">注册</Link>
        </FlexLayout>
      </FormWrapper>
    </LoginWrapper>
  );
};
export default LoginPage;
