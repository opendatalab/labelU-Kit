import { CheckOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useRouteLoaderData } from 'react-router';
import { Button } from 'antd';

import ExportPortal from '@/components/ExportPortal';
import type { TaskLoaderResult } from '@/loaders/task.loader';

import styles from './index.module.scss';

const SamplesFinished = () => {
  const { task: taskData } = useRouteLoaderData('task') as TaskLoaderResult;
  const routeParams = useParams();
  const taskId = +routeParams.taskId!;
  const navigate = useNavigate();
  const handleGoHome = () => {
    navigate(`/tasks/${taskId}?t=${Date.now()}`);
  };

  return (
    <div className={styles.finishedWrapper}>
      <div className={styles.innerWrapper}>
        <div className={styles.check}>
          <CheckOutlined style={{ color: 'var(--color-success)', fontSize: '40px' }} />
        </div>
        <div className={styles.txt}>标注完成</div>
        <div className={styles.stat}>
          <div className={styles.statItem}>已标注： {taskData?.stats?.done}，</div>
          <div className={styles.statItem}>
            未标注： <div style={{ color: 'red' }}>{taskData?.stats?.new}</div>，
          </div>
          <div className={styles.statItem}>跳过：{taskData?.stats?.skipped}</div>
        </div>
        <div className={styles.buttons}>
          <ExportPortal taskId={taskId} mediaType={taskData?.media_type}>
            <Button type="primary" size="large">
              导出数据
            </Button>
          </ExportPortal>
          <Button type="default" size="large" onClick={handleGoHome}>
            返回主页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SamplesFinished;
