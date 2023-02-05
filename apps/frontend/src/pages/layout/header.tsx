import type { FC } from 'react';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useLocale } from '../../locales';
import LogoIcon from '../../img/logo/logo.svg';

const { Header } = Layout;

interface HeaderProps {
  collapsed: boolean;
  toggle: () => void;
}

const HeaderComponent: FC<HeaderProps> = ({ collapsed, toggle }) => {
  // @ts-ignore
  const { logged, device } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { formatMessage } = useLocale();

  const toLogin = () => {
    navigate('/login');
  };

  return (
    <Header className="layout-page-header">
      {device !== 'MOBILE' && (
        <div className="logo" style={{ width: collapsed ? 90 : 200 }}>
          <img src={LogoIcon} alt="" style={{ width: 90 }} />
        </div>
      )}
      <div className="layout-page-header-main">
        <div onClick={toggle}>
          <span id="sidebar-trigger">{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</span>
        </div>
        <div className="actions">
          {logged ? (
            <></>
          ) : (
            <span style={{ cursor: 'pointer' }} onClick={toLogin}>
              {formatMessage({ id: 'gloabal.tips.login' })}
            </span>
          )}
        </div>
      </div>
    </Header>
  );
};

export default HeaderComponent;
