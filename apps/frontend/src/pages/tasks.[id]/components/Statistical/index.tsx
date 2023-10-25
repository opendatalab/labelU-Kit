import { UploadOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useRouteLoaderData } from 'react-router';
import { Button } from 'antd';
import _ from 'lodash-es';
import styled from 'styled-components';

import type { TaskLoaderResult } from '@/loaders/task.loader';
import { MediaType } from '@/api/types';
import FlexLayout from '@/layouts/FlexLayout';

import commonController from '../../../../utils/common';
import ExportPortal from '../../../../components/ExportPortal';

const Circle = styled.div<{
  color: string;
}>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: ${({ color }) => color};
`;

export interface TaskStatusProps {
  status?: 'done' | 'new' | 'skipped';
  count?: number;
}

export function TaskStatus({ children, status, count }: React.PropsWithChildren<TaskStatusProps>) {
  const colorMapping = {
    done: 'var(--color-primary)',
    new: 'var(--color-text-tertiary)',
    skipped: 'var(--orange)',
  };

  const textMapping = {
    done: '已标注',
    new: '未标注',
    skipped: '跳过',
  };

  const color = status ? colorMapping[status] : colorMapping.new;
  const title = status ? textMapping[status] : children;

  return (
    <FlexLayout items="center" gap=".5rem">
      {status && <Circle color={color} />}
      <b>{title}</b>
      {count && <b>{count}</b>}
    </FlexLayout>
  );
}

const Statistical = () => {
  const routerLoaderData = useRouteLoaderData('task') as TaskLoaderResult;
  const taskData = _.get(routerLoaderData, 'task');
  const { stats = {} } = taskData || {};
  const taskId = _.get(taskData, 'id');
  const mediaType = _.get(taskData, 'media_type', MediaType.IMAGE);

  const samples = _.get(routerLoaderData, 'samples');

  const navigate = useNavigate();

  const handleGoAnnotation = () => {
    if (!samples || samples.data.length === 0) {
      return;
    }

    navigate(`/tasks/${taskId}/samples/${samples.data[0].id}`);
  };
  const handleGoConfig = () => {
    navigate(`/tasks/${taskId}/edit#config`);
  };
  const handleGoUpload = () => {
    navigate(`/tasks/${taskId}/edit#upload`);
  };
  return (
    <FlexLayout justify="space-between" items="center">
      <FlexLayout items="center" gap="3rem">
        <b>数据总览</b>
        <TaskStatus status="done" count={stats.done} />
        <TaskStatus status="new" count={stats.new} />
        <TaskStatus status="skipped" count={stats.skipped} />
        <TaskStatus count={stats.done! + stats.new! + stats.skipped!}>总计</TaskStatus>
      </FlexLayout>
      <FlexLayout gap=".5rem">
        <Button type="text" icon={<SettingOutlined />} onClick={handleGoConfig}>
          任务配置
        </Button>
        <ExportPortal taskId={+taskId!} mediaType={mediaType}>
          <Button type="text" icon={<UploadOutlined />}>
            数据导出
          </Button>
        </ExportPortal>
        <Button type="primary" ghost onClick={handleGoUpload}>
          数据导入
        </Button>
        <Button type="primary" onClick={commonController.debounce(handleGoAnnotation, 100)}>
          开始标注
        </Button>
      </FlexLayout>
    </FlexLayout>
  );
};
export default Statistical;
