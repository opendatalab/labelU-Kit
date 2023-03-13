import React, { useEffect } from 'react';
import { Button, Pagination } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import type { Dispatch, RootState } from '@/store';
import { useResponse } from '@/components/FlexItem';

import currentStyles from './index.module.scss';
import TaskCard from './components/taskCard';
import NullTask from './components/nullTask';

const TaskList = () => {
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();

  const { isLargeScreen, isRegularScreen, isSmallScreen, isXLargeScreen, isXSmallScreen, isXXSmallScreen } =
    useResponse();

  let pageSize = 16;

  if (isXXSmallScreen) {
    pageSize = 10;
  } else if (isXSmallScreen) {
    pageSize = 12;
  } else if (isSmallScreen || isRegularScreen) {
    pageSize = 16;
  } else if (isLargeScreen) {
    pageSize = 20;
  } else if (isXLargeScreen) {
    pageSize = 36;
  }

  const [searchParams, setSearchParams] = useSearchParams({
    page: '1',
    size: String(pageSize),
  });

  // 初始化获取任务列表
  useEffect(() => {
    dispatch.task.fetchTasks({
      page: Number(searchParams.get('page')) - 1,
      size: pageSize,
    });
  }, [dispatch.task, pageSize, searchParams]);

  const { meta_data, data: tasks = [] } = useSelector((state: RootState) => state.task.list);

  const createTask = () => {
    dispatch.task.clearTaskItemAndConfig();
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
            <Pagination
              defaultCurrent={1}
              total={meta_data?.total ?? 0}
              pageSize={+searchParams.get('size')!}
              onChange={(value: number) => {
                searchParams.set('page', String(value));
                setSearchParams(searchParams);
              }}
            />
          </div>
        </div>
      )}
      {tasks.length === 0 && <NullTask />}
    </React.Fragment>
  );
};

export default TaskList;
