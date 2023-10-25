import { Form, Input } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';

import { signUp } from '@/api/services/user';
import FlexLayout from '@/layouts/FlexLayout';
import { ReactComponent as EmailIcon } from '@/assets/svg/email.svg';
import { ReactComponent as PasswordIcon } from '@/assets/svg/password.svg';
import { message } from '@/StaticAnt';

import LogoTitle from '../../components/LogoTitle';
import { ButtonWrapper, FormWrapper, LoginWrapper } from '../login/style';

interface FormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

const SignUpPage = () => {
  const [form] = Form.useForm<FormValues>();
  const navigate = useNavigate();
  const signUpMutation = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      message.success('注册成功');
      navigate('/login');
    },
    onError: () => {
      message.error('注册失败');
    },
  });

  const register = async function () {
    form.validateFields().then(async (values) => {
      signUpMutation.mutate(_.pick(values, ['username', 'password']));
    });
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    form.submit();
  };

  return (
    <LoginWrapper flex="column" justify="center" items="center">
      <LogoTitle />
      <FormWrapper gap=".5rem" flex="column">
        <Form form={form} onFinish={register}>
          <FlexLayout flex="column">
            <h1>注册</h1>
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请填写邮箱' },
                { type: 'email', message: '请填写正确的邮箱格式' },
              ]}
            >
              <Input placeholder="邮箱" prefix={<EmailIcon />} />
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
              <Input.Password placeholder="密码" prefix={<PasswordIcon />} visibilityToggle={false} />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                {
                  required: true,
                  message: '请确认密码',
                },
                ({ getFieldValue }) => ({
                  validator(_unused, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error('两次输入密码不一致！'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="确认密码" visibilityToggle={false} prefix={<PasswordIcon />} />
            </Form.Item>

            <Form.Item>
              <ButtonWrapper block type="primary" onClick={handleSubmit} loading={signUpMutation.isPending}>
                注册
              </ButtonWrapper>
            </Form.Item>
          </FlexLayout>
        </Form>
        <FlexLayout justify="flex-end">
          已有账号？<Link to={'/login'}>登录</Link>
        </FlexLayout>
      </FormWrapper>
    </LoginWrapper>
  );
};
export default SignUpPage;
