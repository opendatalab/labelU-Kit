// @ts-ignore
/* eslint-disable */
import request from '@/services/request';

/** List By List task. GET /api/v1/tasks */
export async function listByApiV1TasksGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.listByApiV1TasksGetParams,
  options?: { [key: string]: any },
) {
  return request<Api.TaskResponseWithStatics_>('/api/v1/tasks', {
    method: 'GET',
    params: {
      // size has a default value: 100
      size: '100',
      ...params,
    },
    ...(options || {}),
  });
}

/** Create Create a task with basic config. POST /api/v1/tasks */
export async function createApiV1TasksPost(
  body: Api.BasicConfigCommand,
  options?: { [key: string]: any },
) {
  return request<Api.OkRespTaskResponse_>('/api/v1/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Get Get task detail. GET /api/v1/tasks/${param0} */
export async function getApiV1Tasks_taskId_get(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.getApiV1TasksTaskIdGetParams,
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  return request<Api.OkRespTaskResponseWithStatics_>(`/api/v1/tasks/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Delete Delete task. DELETE /api/v1/tasks/${param0} */
export async function deleteApiV1Tasks_taskId_delete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.deleteApiV1TasksTaskIdDeleteParams,
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  return request<Api.OkRespCommonDataResp_>(`/api/v1/tasks/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Update Update task info, inlucde annotation config, name, description and tips. PATCH /api/v1/tasks/${param0} */
export async function updateApiV1Tasks_taskId_patch(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.updateApiV1TasksTaskIdPatchParams,
  body: Api.UpdateCommand,
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  return request<Api.OkRespTaskResponse_>(`/api/v1/tasks/${param0}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
