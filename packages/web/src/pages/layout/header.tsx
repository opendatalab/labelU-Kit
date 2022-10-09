import { FC } from 'react';
import { LogoutOutlined, UserOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Layout, Dropdown, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import HeaderNoticeComponent from './notice';
import Avator from '../../img/header/avator.jpeg';
// import LanguageSvg from '../../img/header/language.svg';
// import ZhCnSvg from '../../img/header/zh_CN.svg';
// import EnUsSvg from '../../img/header/en_US.svg';
import { LocaleFormatter, useLocale } from '../../locales';
import LogoIcon from '../../img/logo/logo.svg';
// import AntdSvg from '../../img/logo/antd.svg';
import { logoutAsync, setUserItem } from '../../stores/user.store';
import { useDispatch, useSelector } from 'react-redux';
// import SvgIcon from '../../components/basic/svgIcon';

const { Header } = Layout;

interface HeaderProps {
  collapsed: boolean;
  toggle: () => void;
}

type Action = 'userInfo' | 'userSetting' | 'logout';

const HeaderComponent: FC<HeaderProps> = ({ collapsed, toggle }) => {
  const { logged, locale, device } = useSelector(state => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { formatMessage } = useLocale();

  const onActionClick = async (action: Action) => {
    switch (action) {
      case 'userInfo':
        return;
      case 'userSetting':
        return;
      case 'logout':
        const res = Boolean(await dispatch(logoutAsync()));
        res && navigate('/login');
        return;
    }
  };

  const toLogin = () => {
    navigate('/login');
  };

  const selectLocale = ({ key }: { key: any }) => {
    dispatch(setUserItem({ locale: key }));
    localStorage.setItem('locale', key);
  };
  const menu = (
    <Menu>
      <Menu.Item key="1">
        <span>
          <UserOutlined />
          <span onClick={() => navigate('/dashboard')}>
            <LocaleFormatter id="header.avator.account" />
          </span>
        </span>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="2">
        <span>
          <LogoutOutlined />
          <span onClick={() => onActionClick('logout')}>
            <LocaleFormatter id="header.avator.logout" />
          </span>
        </span>
      </Menu.Item>
    </Menu>
  );
  return (
    <Header className="layout-page-header">
      {device !== 'MOBILE' && (
        <div className="logo" style={{ width: collapsed ? 80 : 200 }}>
          {/* <SvgIcon name="logo-react" style={{ marginRight: collapsed ? '2px' : '20px' }} /> */}
          <img src={LogoIcon} alt="" style={{ width: 80, height: 22 }} />
          {/* <img src={AntdSvg} alt="" /> */}

          {/* <SvgIcon name="logo-logo" width={160} height={32}/> */}
        </div>
      )}
      <div className="layout-page-header-main">
        <div onClick={toggle}>
          <span id="sidebar-trigger">{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</span>
        </div>
        <div className="actions">
          {/* <HeaderNoticeComponent /> */}
          {/* <Dropdown
            trigger={['click']}
            overlay={
              <Menu onClick={selectLocale}>
                <Menu.Item style={{ textAlign: 'left' }} disabled={locale === 'zh_CN'} key="zh_CN">
                  <ZhCnSvg />
                  <SvgIcon name="header-zh_CN" />
                  简体中文
                </Menu.Item>
                <Menu.Item style={{ textAlign: 'left' }} disabled={locale === 'en_US'} key="en_US">
                  <EnUsSvg />
                  <SvgIcon name="header-en_US" />
                  English
                </Menu.Item>
              </Menu>
            }
          >
            <span>
              <SvgIcon name="header-language" />

              <LanguageSvg />
            </span>
          </Dropdown> */}
          {logged ? (
            <></>
          ) : (
            // <Dropdown overlay={menu} trigger={['click']}>
            //   <span className="user-action">
            //     {/* <SvgIcon name='header-avator' /> */}
            //     <img src={Avator} className="user-avator" alt="avator" />
            //   </span>
            // </Dropdown>
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
