import request from './request';
import type {
  BasicConfigCommand,
  OkRespCommonDataResp,
  OkRespTaskResponse,
  TaskListResponseWithStatics,
  OkRespTaskResponseWithStatics,
  UpdateCommand,
  ListByApiV1TasksGetParams,
  OkRespAttachmentResponse,
  CreateApiV1TasksTaskIdAttachmentsPostParams,
  DeleteApiV1TasksTaskIdAttachmentsDeleteParams,
  AttachmentDeleteCommand,
} from './types';

export async function getTask(taskId: number): Promise<OkRespTaskResponseWithStatics> {
  return await request.get(`/v1/tasks/${taskId}`, {
    params: {
      task_id: taskId,
    },
  });
}

export async function createTaskWithBasicConfig(data: BasicConfigCommand): Promise<OkRespTaskResponse> {
  return await request.post('/v1/tasks', data);
}

export async function uploadFile(
  params: CreateApiV1TasksTaskIdAttachmentsPostParams & {
    file: File;
  },
): Promise<OkRespAttachmentResponse> {
  const data = new FormData();

  if (params.file) {
    data.append('file', params.file);
  }

  return await request.post(`/v1/tasks/${params.task_id}/attachments`, data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

export async function deleteFile(
  { task_id, ...restParams }: DeleteApiV1TasksTaskIdAttachmentsDeleteParams,
  body: AttachmentDeleteCommand,
): Promise<OkRespCommonDataResp> {
  return await request.delete(`/v1/tasks/${task_id}/attachments`, {
    params: restParams,
    data: body,
  });
}

export async function updateTaskConfig(taskId: number, taskConfig: UpdateCommand): Promise<OkRespTaskResponse> {
  return await request.patch(`/v1/tasks/${taskId}`, taskConfig);
}

export async function getTaskList(params: ListByApiV1TasksGetParams): Promise<TaskListResponseWithStatics> {
  return await request.get('/v1/tasks', {
    params: {
      size: 16,
      ...params,
    },
  });
}

export async function deleteTask(taskId: number): Promise<OkRespCommonDataResp> {
  return await request.delete(`/v1/tasks/${taskId}`, {
    params: {
      task_id: taskId,
    },
  });
}
