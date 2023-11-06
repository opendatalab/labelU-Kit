import { Alert, Button, Pagination } from 'antd';
import { useNavigate, useRouteLoaderData, useSearchParams } from 'react-router-dom';
import _ from 'lodash';
import styled from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

import type { TaskListResponseWithStatics } from '@/api/types';
import { usePageSize } from '@/hooks/usePageSize';
import { ResponsiveGrid } from '@/components/ResponsiveGrid';

import TaskCard from './components/taskCard';
import NullTask from './components/nullTask';

const Wrapper = styled(FlexLayout)`
  height: calc(100vh - var(--header-height));
  padding: 0 1.5rem;
  box-sizing: border-box;
`;

const CardsWrapper = styled(ResponsiveGrid)`
  height: 100%;
`;

const Header = styled(FlexLayout.Header)`
  padding: 1rem 0;
`;

const Footer = styled(FlexLayout.Footer)`
  padding: 1rem 0;
`;

const TaskCardItem = styled(TaskCard)``;

const TaskList = () => {
  const navigate = useNavigate();
  const routerLoaderData = useRouteLoaderData('tasks') as TaskListResponseWithStatics;
  const tasks = _.get(routerLoaderData, 'data');
  const meta_data = _.get(routerLoaderData, 'meta_data');
  const pageSize = usePageSize();

  const [searchParams, setSearchParams] = useSearchParams({
    size: String(pageSize),
  });

  const createTask = () => {
    navigate('/tasks/0/edit?isNew=true');
  };

  return (
    <Wrapper flex="column">
      <FlexLayout.Content scroll flex="column">
        {window.IS_ONLINE && (
          <Alert
            type="info"
            style={{
              marginTop: '1rem',
            }}
            showIcon
            message={
              <div>
                当前为体验版，每日凌晨数据将自动清空，请及时备份重要数据。如需完整使用，建议
                <a href="https://github.com/opendatalab/labelU#getting-started" target="_blank" rel="noreferrer">
                  本地部署
                </a>
              </div>
            }
          />
        )}
        {tasks.length > 0 && (
          <Header>
            <Button type="primary" onClick={createTask}>
              新建任务
            </Button>
          </Header>
        )}
        <FlexLayout.Content scroll>
          {meta_data && meta_data?.total > 0 ? (
            <CardsWrapper>
              {tasks.map((cardInfo: any, cardInfoIndex: number) => {
                return <TaskCardItem key={cardInfoIndex} cardInfo={cardInfo} />;
              })}
            </CardsWrapper>
          ) : (
            <NullTask />
          )}
        </FlexLayout.Content>
      </FlexLayout.Content>
      <Footer flex="column" items="flex-end">
        {meta_data && searchParams && meta_data?.total > pageSize && (
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
        )}
      </Footer>
    </Wrapper>
  );
};

export default TaskList;
