import React, { useState, useEffect } from 'react';
import { Pagination } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import currentStyles from './index.module.scss';
import TaskCard from '../../components/taskCard';
import Constatns from '../../constants';
import { getTaskList } from '../../services/createTask';
import CommonController from '../../utils/common/common';
import { updateConfigStep, updateHaveConfigedStep, updateTask } from '../../stores/task.store';
import NullTask from '../nullTask';
import { clearConfig } from '../../stores/toolConfig.store';
const TaskList = () => {
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
          config: '',
        },
      }),
    );
    dispatch(clearConfig());
    navigate(Constatns.urlToCreateNewTask);
  };
  const [taskCards, setTaskCards] = useState<any>([]);
  const [taskTotal, setTaskTotal] = useState<any>(0);
  const requestTaskList = (page: number) => {
    getTaskList(page).then((res) => {
      if (res) {
        if (res.status === 200) {
          setTaskCards(res.data?.data);
          setTaskTotal(res.data?.meta_data?.total);
        } else {
          // CommonController.notificationErrorMessage({message : '拉取文件列表状态码不是200'},1);
        }
      } else {
        CommonController.notificationErrorMessage({ message: '拉取文件列表失败, 请刷新页面' }, 1);
      }
    });
  };

  const changeCurrentPage = (page: number) => {
    requestTaskList(page - 1);
  };
  useEffect(function () {
    requestTaskList(0);
  }, []);

  useEffect(() => {
    requestTaskList(0);
    // REVIEW: }, [window.location.search]);
  }, []);
  return (
    <React.Fragment>
      {taskCards.length > 0 && (
        <div className={currentStyles.outerFrame}>
          <div className={currentStyles.createTaskButtonRow}>
            <div className={currentStyles.createTaskButton} onClick={createTask}>
              新建任务
            </div>
          </div>
          <div className={currentStyles.cards}>
            {taskCards.map((cardInfo: any, cardInfoIndex: number) => {
              return <TaskCard key={cardInfoIndex} cardInfo={cardInfo} />;
            })}
          </div>
          <div className={currentStyles.pagination}>
            <Pagination defaultCurrent={1} total={taskTotal} pageSize={16} onChange={changeCurrentPage} />
          </div>
        </div>
      )}
      {taskCards.length === 0 && <NullTask />}
    </React.Fragment>
  );
};
export default TaskList;
