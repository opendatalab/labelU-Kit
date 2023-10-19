import { useNavigate } from 'react-router-dom';

import styles from './index.module.scss';

const NullTask = () => {
  const navigate = useNavigate();
  const createTask = () => {
    navigate('/tasks/0/edit?isNew=true');
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
