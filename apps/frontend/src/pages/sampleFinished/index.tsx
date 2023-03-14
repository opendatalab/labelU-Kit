import { CheckOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import ExportPortal from '@/components/ExportPortal';
import type { Dispatch, RootState } from '@/store';

import styles from './index.module.scss';

const SamplesFinished = () => {
  const dispatch = useDispatch<Dispatch>();
  const taskData = useSelector((state: RootState) => state.task.item);
  const routeParams = useParams();
  const taskId = +routeParams.taskId!;
  const navigate = useNavigate();
  const handleGoHome = () => {
    navigate(`/tasks/${taskId}?t=${Date.now()}`);
  };

  useEffect(() => {
    dispatch.task.fetchTask(taskId);
  }, [dispatch.task, taskId]);

  return (
    <div className={styles.finishedWrapper}>
      <div className={styles.innerWrapper}>
        <div className={styles.check}>
          <CheckOutlined style={{ color: '#64ba64', fontSize: '40px' }} />
        </div>
        <div className={styles.txt}>标注完成</div>
        <div className={styles.stat}>
          <div className={styles.statItem}>已标注： {taskData?.stats?.done},</div>
          <div className={styles.statItem}>
            未标注： <div style={{ color: 'red' }}>{taskData?.stats?.new}</div>,
          </div>
          <div className={styles.statItem}>跳过：{taskData?.stats?.skipped}</div>
        </div>
        <div className={styles.buttons}>
          <ExportPortal taskId={taskId}>
            <Button type="primary" size="large">
              导出数据
            </Button>
          </ExportPortal>
          <Button type="text" size="large" onClick={handleGoHome}>
            返回主页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SamplesFinished;
