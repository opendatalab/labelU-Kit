import { useNavigate } from 'react-router-dom';

import currentStyles from './index.module.scss';
import Constatns from '../../constants';
const NullTask = () => {
  const navigate = useNavigate();
  const createTask = () => {
    navigate(Constatns.urlToCreateNewTask);
  };
  return (
    <div className={currentStyles.outerFrame} onClick={createTask}>
      <div className={currentStyles.container}>
        <div className={currentStyles.createTaskIcon}>
          <img src="/src/icons/createTask.svg" alt="" />
        </div>
        <div className={currentStyles.createTask}>新建任务</div>
      </div>
    </div>
  );
};
export default NullTask;
