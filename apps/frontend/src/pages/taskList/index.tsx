import React, { useState, useEffect } from 'react';
import { Button, Pagination } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { Dispatch, RootState } from '@/store';

import currentStyles from './index.module.scss';
import TaskCard from './components/taskCard';
import NullTask from '../nullTask';

const TaskList = () => {
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  // 初始化获取任务列表
  useEffect(() => {
    dispatch.task.fetchTasks({
      page: currentPage - 1,
    });
  }, [currentPage, dispatch.task]);

  const { meta_data, data: tasks = [] } = useSelector((state: RootState) => state.task.list);

  const createTask = () => {
    navigate('/tasks/0/edit');
  };

  return (
    <React.Fragment>
      {tasks.length > 0 && (
        <div className={currentStyles.tasksWrapper}>
          <Button className={currentStyles.createTaskButton} type="primary" onClick={createTask}>
            新建任务
          </Button>
          <div className={currentStyles.cards}>
            {tasks.map((cardInfo: any, cardInfoIndex: number) => {
              return <TaskCard key={cardInfoIndex} cardInfo={cardInfo} />;
            })}
          </div>
          <div className={currentStyles.pagination}>
            <Pagination defaultCurrent={1} total={meta_data?.total ?? 0} pageSize={16} onChange={setCurrentPage} />
          </div>
        </div>
      )}
      {tasks.length === 0 && <NullTask />}
    </React.Fragment>
  );
};

export default TaskList;
