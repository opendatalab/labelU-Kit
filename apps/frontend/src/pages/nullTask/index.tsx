import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import currentStyles from './index.module.scss';
import { updateConfigStep, updateHaveConfigedStep, updateTask } from '../../stores/task.store';
import Constatns from '../../constants';
import { clearConfig } from '../../stores/toolConfig.store';
const NullTask = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const createTask = () => {
    // @ts-ignore
    dispatch(updateConfigStep(-1));
    // @ts-ignore
    dispatch(updateHaveConfigedStep(0));
    dispatch(
      // @ts-ignore
      updateTask({
        data: {
          name: '',
          tips: '',
          description: '',
          // config : ''
        },
      }),
    );
    dispatch(clearConfig());
    navigate(Constatns.urlToCreateNewTask);
  };
  return (
    <div className={currentStyles.outerFrame} onClick={createTask}>
      <div className={currentStyles.container}>
        {/*<div className = {currentStyles.createTaskIcon}></div>*/}
        <div className={currentStyles.createTaskIcon}>
          <img src="/src/icons/createTask.svg" alt="" />
        </div>
        <div className={currentStyles.createTask}>新建任务</div>
      </div>
    </div>
  );
};
export default NullTask;
