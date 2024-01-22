import { BulbOutlined } from '@ant-design/icons';
import { Button, Popover } from 'antd';
import { useRouteLoaderData } from 'react-router';

import type { TaskLoaderResult } from '@/loaders/task.loader';

export default function TaskTip({ visible }: { visible: boolean }) {
  const { task } = (useRouteLoaderData('task') ?? {}) as TaskLoaderResult;

  if (!visible) {
    return null;
  }

  return (
    <Popover content={<div style={{ maxWidth: 420 }}>{task?.tips ?? '暂无任务提示'}</div>}>
      <Button type="link" style={{ color: 'rgba(0, 0, 0, 0.85)' }} icon={<BulbOutlined />}>
        任务提示
      </Button>
    </Popover>
  );
}
