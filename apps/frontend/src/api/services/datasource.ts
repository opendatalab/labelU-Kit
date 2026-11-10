import request from '../request';
import type {
  CreateDataSourceCommand,
  UpdateDataSourceCommand,
  ListDataSourcesParams,
  DataSourceListResponse,
  DataSourceResponse,
  ListS3ObjectsParams,
  S3ObjectListResponse,
  ImportS3SamplesCommand,
  OkResponse,
  OkRespCommonDataResp,
  OkRespCreateSampleResponse,
} from '../types';

export async function getDataSources({ page, ...params }: ListDataSourcesParams): Promise<DataSourceListResponse> {
  return await request.get('/v1/datasources', {
    params: {
      ...params,
      page: typeof page === 'undefined' ? 0 : page - 1,
    },
  });
}

export async function getDataSource(dsId: number): Promise<OkResponse<DataSourceResponse>> {
  return await request.get(`/v1/datasources/${dsId}`);
}

export async function createDataSource(data: CreateDataSourceCommand): Promise<OkResponse<DataSourceResponse>> {
  return await request.post('/v1/datasources', data);
}

export async function updateDataSource(
  dsId: number,
  data: UpdateDataSourceCommand,
): Promise<OkResponse<DataSourceResponse>> {
  return await request.patch(`/v1/datasources/${dsId}`, data);
}

export async function deleteDataSource(dsId: number): Promise<OkRespCommonDataResp> {
  return await request.delete(`/v1/datasources/${dsId}`);
}

export async function listS3Objects({
  ds_id,
  ...params
}: ListS3ObjectsParams): Promise<OkResponse<S3ObjectListResponse>> {
  return await request.get(`/v1/datasources/${ds_id}/objects`, {
    params,
  });
}

export async function importS3Samples(
  taskId: number,
  data: ImportS3SamplesCommand,
): Promise<OkRespCreateSampleResponse> {
  return await request.post(`/v1/tasks/${taskId}/samples/import_s3`, data);
}
