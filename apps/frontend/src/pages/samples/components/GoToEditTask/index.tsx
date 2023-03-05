import { InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { Button } from 'antd';

import currentStyles from './index.module.scss';

const GoToEditTask = (props: any) => {
  const { taskStatus } = props;
  const navigate = useNavigate();
  const turnToEditTask = () => {
    const taskId = parseInt(window.location.pathname.split('/')[2]);
    if (taskId > 0) {
      let tail = 'basic';
      switch (taskStatus) {
        case 'DRAFT':
          tail = 'basic';
          break;
        case 'IMPORTED':
        case 'CONFIGURED':
          tail = 'config';
          break;
      }
      navigate('/tasks/' + taskId + '/edit#' + tail);
    }
  };
  return (
    <div className={currentStyles.outerFrame}>
      <InfoCircleOutlined style={{ color: '#F5483B' }} className={currentStyles.icon} />
      <div className={currentStyles.txt}>请先完成任务配置， 再开始标注</div>
      <Button type="primary" ghost onClick={turnToEditTask}>
        去配置
      </Button>
    </div>
  );
};
export default GoToEditTask;
