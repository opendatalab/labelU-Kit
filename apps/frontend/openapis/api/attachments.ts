// @ts-ignore
/* eslint-disable */
import request from '@/services/request';

/** Create Create attechment as annnotation sample. POST /api/v1/tasks/${param0}/attachments */
export async function createApiV1Tasks_taskId_attachmentsPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.createApiV1TasksTaskIdAttachmentsPostParams,
  body: Api.BodyCreateApiV1Tasks_taskId_attachmentsPost,
  file?: File,
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      formData.append(
        ele,
        typeof item === 'object' && !(item instanceof File) ? JSON.stringify(item) : item,
      );
    }
  });

  return request<Api.OkRespAttachmentResponse_>(`/api/v1/tasks/${param0}/attachments`, {
    method: 'POST',
    params: { ...queryParams },
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** Delete delete task. DELETE /api/v1/tasks/${param0}/attachments */
export async function deleteApiV1Tasks_taskId_attachmentsDelete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.deleteApiV1TasksTaskIdAttachmentsDeleteParams,
  body: Api.AttachmentDeleteCommand,
  options?: { [key: string]: any },
) {
  const { task_id: param0, ...queryParams } = params;
  return request<Api.OkRespCommonDataResp_>(`/api/v1/tasks/${param0}/attachments`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Download Attachment download attachment. GET /api/v1/tasks/attachment/${param0} */
export async function downloadAttachmentApiV1TasksAttachment_filePath_get(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Api.downloadAttachmentApiV1TasksAttachmentFilePathGetParams,
  options?: { [key: string]: any },
) {
  const { file_path: param0, ...queryParams } = params;
  return request<any>(`/api/v1/tasks/attachment/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}
