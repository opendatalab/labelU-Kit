import React from 'react';
import { Button, Pagination } from 'antd';
import { useNavigate, useRouteLoaderData, useSearchParams } from 'react-router-dom';
import _ from 'lodash';

import { useResponse } from '@/components/FlexItem';
import type { TaskListResponseWithStatics } from '@/api/types';

import currentStyles from './index.module.scss';
import TaskCard from './components/taskCard';
import NullTask from './components/nullTask';

const TaskList = () => {
  const navigate = useNavigate();
  const routerLoaderData = useRouteLoaderData('tasks') as TaskListResponseWithStatics;
  const tasks = _.get(routerLoaderData, 'data');
  const meta_data = _.get(routerLoaderData, 'meta_data');

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
    size: String(pageSize),
  });
  const createTask = () => {
    navigate('/tasks/0/edit?isNew=true');
  };

  return (
    <React.Fragment>
      <div className={currentStyles.tasksWrapper}>
        {tasks.length > 0 && (
          <Button className={currentStyles.createTaskButton} type="primary" onClick={createTask}>
            新建任务
          </Button>
        )}
        <div className={currentStyles.cards}>
          {tasks.map((cardInfo: any, cardInfoIndex: number) => {
            return <TaskCard key={cardInfoIndex} cardInfo={cardInfo} />;
          })}
          {meta_data?.total === 0 && <NullTask />}
        </div>
        {meta_data && searchParams && meta_data?.total > pageSize && (
          <div className={currentStyles.pagination}>
            <Pagination
              defaultCurrent={searchParams.get('page') ? +searchParams.get('page')! : 1}
              total={meta_data?.total ?? 0}
              pageSize={+searchParams.get('size')!}
              onChange={(value: number, _pageSize: number) => {
                searchParams.set('size', String(_pageSize));
                searchParams.set('page', String(value));
                setSearchParams(searchParams);
              }}
            />
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default TaskList;
