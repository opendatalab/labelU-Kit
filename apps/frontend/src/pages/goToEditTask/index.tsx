import { InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { Button } from 'antd';

import currentStyles from './index.module.scss';
import { getTask } from '../../services/samples';
import { updateTask } from '../../stores/task.store';
import { updateAllConfig, clearConfig } from '../../stores/toolConfig.store';
import commonController from '../../utils/common/common';

const GoToEditTask = (props: any) => {
  const { taskStatus } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const turnToEditTask = () => {
    const taskId = parseInt(window.location.pathname.split('/')[2]);
    if (taskId > 0) {
      getTask(taskId)
        .then((res: any) => {
          if (res.status === 200) {
            // @ts-ignore
            dispatch(updateTask({ data: res.data.data }));
            if (res.data.data.config) {
              dispatch(updateAllConfig(JSON.parse(res.data.data.config)));
            } else {
              dispatch(clearConfig());
            }

            let tail = 'basic';
            switch (taskStatus) {
              case 'DRAFT':
                tail = 'basic';
                break;
              case 'IMPORTED':
                // tail = 'upload';
                tail = 'config?currentStatus=3';
                break;
              case 'CONFIGURED':
                tail = 'config';
                break;
            }
            navigate('/tasks/' + taskId + '/edit/' + tail);
          } else {
            commonController.notificationErrorMessage({ message: '请求任务状态不是200' }, 1);
          }
        })
        .catch((error) => commonController.notificationErrorMessage(error, 1));
    }
  };
  return (
    <div className={currentStyles.outerFrame}>
      <InfoCircleOutlined style={{ color: '#F5483B' }} className={currentStyles.icon} />
      <div className={currentStyles.txt}>请先完成任务配置， 再开始标注</div>
      &nbsp; &nbsp;
      <Button type="primary" ghost onClick={turnToEditTask}>
        去配置
      </Button>
    </div>
  );
};
export default GoToEditTask;
