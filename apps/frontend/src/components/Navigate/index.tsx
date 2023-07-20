import { Button, Divider, Dropdown, Tag } from 'antd';
import Icon, { PoweroffOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';

import { ReactComponent as ProfileIcon } from '@/assets/svg/personal.svg';
import { ReactComponent as LocalDeploy } from '@/assets/svg/local-deploy.svg';
import type { Dispatch } from '@/store';
import { goLogin } from '@/utils/sso';

import Breadcrumb from '../Breadcrumb';
import styles from './index.module.scss';
import HelpTips from '../helpTips';

const Homepage = () => {
  const username = localStorage.getItem('username');
  const dispatch = useDispatch<Dispatch>();

  const logout = async (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    await dispatch.user.logout();
    goLogin();
  };

  return (
    <div className={styles.navigator}>
      <div className={styles.left}>
        <div className={styles.logo} />
        <Tag bordered={false} color="var(--color-fill-secondary)" style={{ color: 'var(--color-text)' }}>
          Beta
        </Tag>
        <Divider type="vertical" />
        <div className={styles.breadcrumb}>
          <Breadcrumb hideHome />
        </div>
      </div>
      <div className={styles.right}>
        <a href="https://github.com/opendatalab/labelU#getting-started">
          <Button type="link" style={{ color: 'rgba(0, 0, 0, 0.85)' }} icon={<Icon component={LocalDeploy} />}>
            本地部署
          </Button>
        </a>
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
