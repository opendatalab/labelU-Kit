import type { LoaderFunctionArgs } from 'react-router';

import { getTask } from '@/services/task';
import { store } from '@/store';
import { getSample, getSamples } from '@/services/samples';

export async function taskLoader({ params }: LoaderFunctionArgs) {
  // taskId 为 0 时，表示新建任务
  if (!params?.taskId || params.taskId === '0') {
    return null;
  }

  const taskData = await getTask(+params.taskId);

  store.dispatch.task.setTask(taskData.data);

  return taskData.data;
}

export async function annotationLoader({ params }: LoaderFunctionArgs) {
  if (!params?.taskId || params.taskId === '0' || !params?.sampleId) {
    return null;
  }

  const { data } = await getSample({
    task_id: +params.taskId,
    sample_id: +params.sampleId,
  });
  const samples = await getSamples({
    task_id: +params.taskId,
    pageNo: 1,
    pageSize: 100,
  });

  store.dispatch.sample.setSample(data);
  store.dispatch.sample.setSamples(samples);

  return {
    sample: data,
    samples,
  };
}
