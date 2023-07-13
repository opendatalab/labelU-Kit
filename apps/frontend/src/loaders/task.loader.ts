import type { LoaderFunctionArgs } from 'react-router';

import { getTask } from '@/services/task';
import { store } from '@/store';

export async function taskLoader({ params }: LoaderFunctionArgs) {
  // taskId 为 0 时，表示新建任务
  if (!params?.taskId || params.taskId === '0') {
    return null;
  }

  const taskData = await getTask(+params.taskId);

  store.dispatch.task.setTask(taskData.data);

  return taskData.data;
}
