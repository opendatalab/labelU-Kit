import { useMutation } from '@tanstack/react-query';

import { createTaskWithBasicConfig, updateTaskConfig } from '@/api/services/task';

import type { UpdateCommand } from '../types';

export function useAddTaskMutation() {
  return useMutation({
    mutationFn: createTaskWithBasicConfig,
  });
}

export function useUpdateTaskConfigMutation(taskId: number | string) {
  return useMutation({
    mutationFn: (payload: UpdateCommand) => updateTaskConfig(+taskId, payload),
  });
}
