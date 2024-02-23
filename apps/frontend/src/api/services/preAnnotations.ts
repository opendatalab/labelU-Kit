import request from '../request';
import type {
  DeleteApiV1TasksTaskIdDeleteParams,
  ListByApiV1TasksTaskIdSamplesGetParams,
  OkRespCommonDataResp,
  OkRespCreateSampleResponse,
  PreAnnotationResponse,
} from '../types';

export async function createPreAnnotations(
  taskId: number,
  data: {
    file_id: number;
  }[],
): Promise<OkRespCreateSampleResponse> {
  return await request.post(`/v1/tasks/${taskId}/pre_annotations`, data);
}

export async function getPreAnnotations({
  task_id,
  ...params
}: ListByApiV1TasksTaskIdSamplesGetParams & {
  sample_name?: string;
}): Promise<PreAnnotationResponse> {
  return await request.get(`/v1/tasks/${task_id}/pre_annotations`, {
    params: {
      ...params,
      pageNo: typeof params.pageNo === 'undefined' ? 0 : params.pageNo - 1,
    },
  });
}

export async function deletePreAnnotations(
  { task_id }: DeleteApiV1TasksTaskIdDeleteParams,
  body: {
    pre_annotation_ids: number[];
  },
): Promise<OkRespCommonDataResp> {
  return await request.delete(`/v1/tasks/${task_id}/pre_annotations`, {
    data: body,
  });
}
