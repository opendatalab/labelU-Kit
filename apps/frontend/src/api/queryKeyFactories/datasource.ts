import type { ListDataSourcesParams, ListS3ObjectsParams } from '../types';

export const datasourceKey = {
  all: ['datasourceKey'] as const,
  lists: () => [...datasourceKey.all, 'list'] as const,
  list: (filter: ListDataSourcesParams) => [...datasourceKey.lists(), filter] as const,
  details: () => [...datasourceKey.all, 'details'] as const,
  detail: (id: number) => [...datasourceKey.details(), id] as const,
  objects: () => [...datasourceKey.all, 'objects'] as const,
  objectList: (filter: ListS3ObjectsParams) => [...datasourceKey.objects(), filter] as const,
};
