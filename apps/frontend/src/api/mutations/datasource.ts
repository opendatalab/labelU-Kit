import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createDataSource, deleteDataSource, importS3Samples, updateDataSource } from '@/api/services/datasource';
import { datasourceKey } from '@/api/queryKeyFactories/datasource';
import { sampleKey } from '@/api/queryKeyFactories/sample';

import type { CreateDataSourceCommand, ImportS3SamplesCommand, UpdateDataSourceCommand } from '../types';

export function useCreateDataSourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDataSourceCommand) => createDataSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKey.lists() });
    },
  });
}

export function useUpdateDataSourceMutation(dsId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDataSourceCommand) => updateDataSource(dsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKey.lists() });
    },
  });
}

export function useDeleteDataSourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dsId: number) => deleteDataSource(dsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKey.lists() });
    },
  });
}

export function useImportS3SamplesMutation(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImportS3SamplesCommand) => importS3Samples(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sampleKey.lists() });
    },
  });
}
