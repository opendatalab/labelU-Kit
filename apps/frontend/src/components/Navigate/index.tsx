import { Button, Dropdown } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import Icon, { BellOutlined, PoweroffOutlined } from '@ant-design/icons';
import { FlexLayout } from '@labelu/components-react';

import { ReactComponent as ProfileIcon } from '@/assets/svg/personal.svg';

import Breadcrumb from '../Breadcrumb';
import { LabeluLogo, NavigationWrapper } from './style';

const Homepage = () => {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  const logout = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    localStorage.setItem('username', '');
    localStorage.setItem('token', '');
    navigate('/login');
  };

  return (
    <NavigationWrapper items="center" justify="space-between" padding="0 2rem">
      <FlexLayout.Item flex items="center" gap="2.5rem">
        <Link to="/">
          <LabeluLogo />
        </Link>
        <Breadcrumb />
      </FlexLayout.Item>
      <FlexLayout.Item flex gap="1rem">
        <Button
          type="link"
          icon={<BellOutlined />}
          href="https://github.com/opendatalab/labelU/blob/main/docs/GUIDE.md"
          style={{ color: 'rgba(0, 0, 0, 0.85)' }}
          target="_blank"
          rel="noreferrer"
        >
          帮助文档
        </Button>
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                label: (
                  <FlexLayout.Item onClick={logout} flex gap=".5rem" padding=".25rem 0">
                    <PoweroffOutlined />
                    <span>退出登录</span>
                  </FlexLayout.Item>
                ),
                key: 'logout',
                title: '退出登录',
              },
            ],
          }}
        >
          <Button icon={<Icon component={ProfileIcon} />} type="link" style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
            {username}
          </Button>
        </Dropdown>
      </FlexLayout.Item>
    </NavigationWrapper>
  );
};
export default Homepage;
