// @ts-ignore
/* eslint-disable */
import request from '@/services/request';

/** List By Get a annotation result. GET /api/v1/tasks/${param0}/samples */
export async function listByApiV1Tasks_taskId_samplesGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.listByApiV1TasksTaskIdSamplesGetParams,
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  return request<Api.SampleResponse_>(`/api/v1/tasks/${param0}/samples`, {
    method: 'GET',
    params: {
      // pageSize has a default value: 100
      pageSize: '100',
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** Create Create a sample. POST /api/v1/tasks/${param0}/samples */
export async function createApiV1Tasks_taskId_samplesPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.createApiV1TasksTaskIdSamplesPostParams,
  body: Api.CreateSampleCommand[],
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  return request<Api.OkRespCreateSampleResponse_>(`/api/v1/tasks/${param0}/samples`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Delete delete a annotation. DELETE /api/v1/tasks/${param0}/samples */
export async function deleteApiV1Tasks_taskId_samplesDelete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.deleteApiV1TasksTaskIdSamplesDeleteParams,
  body: Api.DeleteSampleCommand,
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  return request<Api.OkRespCommonDataResp_>(`/api/v1/tasks/${param0}/samples`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Get Get a annotation result. GET /api/v1/tasks/${param0}/samples/${param1} */
export async function getApiV1Tasks_taskId_samples_sampleId_get(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.getApiV1TasksTaskIdSamplesSampleIdGetParams,
  options?: { [key: string]: any },
) {
  const { task_id: param0, sample_id: param1, ...queryParams } = params;
  return request<Api.OkRespSampleResponse_>(`/api/v1/tasks/${param0}/samples/${param1}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Update update a annotation. PATCH /api/v1/tasks/${param0}/samples/${param1} */
export async function updateApiV1Tasks_taskId_samples_sampleId_patch(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.updateApiV1TasksTaskIdSamplesSampleIdPatchParams,
  body: Api.PatchSampleCommand,
  options?: { [key: string]: any },
) {
  const { task_id: param0, sample_id: param1, ...queryParams } = params;
  return request<Api.OkRespSampleResponse_>(`/api/v1/tasks/${param0}/samples/${param1}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Get Pre Get a annotation result. GET /api/v1/tasks/${param0}/samples/${param1}/pre */
export async function getPreApiV1Tasks_taskId_samples_sampleId_preGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.getPreApiV1TasksTaskIdSamplesSampleIdPreGetParams,
  options?: { [key: string]: any },
) {
  const { task_id: param0, sample_id: param1, ...queryParams } = params;
  return request<Api.OkRespSampleResponse_>(`/api/v1/tasks/${param0}/samples/${param1}/pre`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Export export data. POST /api/v1/tasks/${param0}/samples/export */
export async function exportApiV1Tasks_taskId_samplesExportPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.exportApiV1TasksTaskIdSamplesExportPostParams,
  body: Api.ExportSampleCommand,
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tasks/${param0}/samples/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      ...queryParams,
    },
    data: body,
    ...(options || {}),
  });
}
