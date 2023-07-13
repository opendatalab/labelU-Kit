import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { Dispatch } from '@/store';

import styles from './index.module.scss';

const NullTask = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<Dispatch>();
  const createTask = () => {
    dispatch.task.clearTaskItemAndConfig();
    navigate('/tasks/0/edit');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.nullWrapper} onClick={createTask}>
        <div className={styles.container}>
          <div className={styles.createTaskIcon}>
            <img src="/src/icons/createTask.svg" alt="" />
          </div>
          <div className={styles.createTask}>新建任务</div>
        </div>
      </div>
    </div>
  );
};
export default NullTask;
