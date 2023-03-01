import { Button, Dropdown } from 'antd';
import _ from 'lodash-es';
import { useLoaderData, useNavigate } from 'react-router-dom';
import Icon, { PoweroffOutlined } from '@ant-design/icons';

import { ReactComponent as ProfileIcon } from '@/assets/svg/personal.svg';

import Breadcrumb from '../Breadcrumb';
import currentStyles from './index.module.scss';
import AnnotationTips from '../../components/annotationTips';
import HelpTips from '../helpTips';

const Homepage = () => {
  const username = localStorage.getItem('username');
  const taskData = useLoaderData();
  const taskTips = _.get(taskData, 'tips', '');
  const navigate = useNavigate();
  const isShowAnnotationTips = !Boolean(taskData);
  const isShowHelp = Boolean(taskData);

  console.log('taskTips', taskData);

  const signOut = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    localStorage.setItem('username', '');
    localStorage.setItem('token', '');
    navigate('/login');
  };
  return (
    <div className={currentStyles.navigator}>
      <div className={currentStyles.left}>
        <div className={currentStyles.logo} />
        <div className={currentStyles.breadcrumb}>
          <Breadcrumb />
        </div>
      </div>
      <div className={currentStyles.right}>
        {/* @ts-ignore */}
        {isShowHelp && <HelpTips taskTips={taskTips} />}
        {isShowAnnotationTips && <AnnotationTips />}
        <Dropdown
          overlayClassName={currentStyles.dropDownOverlay}
          menu={{
            items: [
              {
                label: (
                  <div className={currentStyles.quit} onClick={signOut}>
                    退出登录
                    <PoweroffOutlined />
                  </div>
                ),
                key: 'signOut',
                title: '退出登录',
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="link" style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
            {username}
            <Icon component={ProfileIcon} />
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};
export default Homepage;
