import { Button, Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';
import Icon, { PoweroffOutlined } from '@ant-design/icons';

import { ReactComponent as ProfileIcon } from '@/assets/svg/personal.svg';

import Breadcrumb from '../Breadcrumb';
import styles from './index.module.scss';
import HelpTips from '../helpTips';

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
    <div className={styles.navigator}>
      <div className={styles.left}>
        <div className={styles.logo} />
        <div className={styles.breadcrumb}>
          <Breadcrumb style={{ fontSize: 14 }} />
        </div>
      </div>
      <div className={styles.right}>
        <HelpTips />
        <Dropdown
          overlayClassName={styles.dropDownOverlay}
          menu={{
            items: [
              {
                label: (
                  <div className={styles.quit} onClick={logout}>
                    退出登录
                    <PoweroffOutlined />
                  </div>
                ),
                key: 'logout',
                title: '退出登录',
              },
            ],
          }}
          trigger={['click']}
        >
          <Button icon={<Icon component={ProfileIcon} />} type="link" style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
            {username}
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};
export default Homepage;
