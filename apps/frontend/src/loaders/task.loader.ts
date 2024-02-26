import type { LoaderFunctionArgs } from 'react-router';

import { sampleKey, taskKey } from '@/api/queryKeyFactories';
import { getTaskList, getTask } from '@/api/services/task';
import queryClient from '@/api/queryClient';
import { getSamples } from '@/api/services/samples';
import type { SampleListResponse, TaskResponseWithStatics } from '@/api/types';
import type { ToolsConfigState } from '@/types/toolConfig';
import { preAnnotationKey } from '@/api/queryKeyFactories/preAnnotation';
import { getPreAnnotations } from '@/api/services/preAnnotations';

export async function tasksLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const queryParams = Object.fromEntries(searchParams.entries());

  if (searchParams.has('clientId')) {
    return null;
  }

  return await queryClient.fetchQuery({
    queryKey: taskKey.list(queryParams),
    queryFn: () => getTaskList(queryParams),
  });
}

export type TaskInLoader = Omit<TaskResponseWithStatics, 'config'> & {
  config: ToolsConfigState;
};

export interface TaskLoaderResult {
  samples?: SampleListResponse;
  task?: TaskInLoader;

  preAnnotations?: {
    sample_name: string;
    annotations: any;
  }[];
}

export async function taskLoader({ params, request }: LoaderFunctionArgs) {
  const result: TaskLoaderResult = {
    samples: undefined,
    task: undefined,
    preAnnotations: undefined,
  };

  // taskId 为 0 时，表示新建任务
  if (!params?.taskId || params.taskId === '0') {
    return result;
  }

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const queryParams = {
    task_id: +params.taskId,
    ...Object.fromEntries(searchParams.entries()),
  };

  const sampleQueryKey = sampleKey.list(queryParams);

  result.samples = await queryClient.fetchQuery({
    queryKey: sampleQueryKey,
    queryFn: () => getSamples(queryParams),
  });

  const preAnnotationQueryKey = preAnnotationKey.list({ task_id: +params.taskId });

  result.preAnnotations = await queryClient.fetchQuery({
    queryKey: preAnnotationQueryKey,
    queryFn: () => getPreAnnotations(queryParams),
  });

  const taskDetail = await queryClient.fetchQuery({
    queryKey: taskKey.detail(params.taskId),
    queryFn: () => getTask(+params.taskId!),
  });

  if (taskDetail?.data) {
    result.task = {
      ...taskDetail.data,
      config: taskDetail.data.config ? JSON.parse(taskDetail.data.config) : null,
    };
  }

  return result;
}
