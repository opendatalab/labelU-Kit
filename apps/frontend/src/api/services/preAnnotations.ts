import request from '../request';
import type {
  DeleteApiV1TasksTaskIdDeleteParams,
  GetPreAnnotationDetailParams,
  GetPreAnnotationDetailsParams,
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
}: ListByApiV1TasksTaskIdSamplesGetParams): Promise<{ data: PreAnnotationResponse }> {
  return await request.get(`/v1/tasks/${task_id}/pre_annotations`, {
    params: {
      ...params,
      pageNo: typeof params.pageNo === 'undefined' ? 0 : params.pageNo - 1,
    },
  });
}

export async function getPreAnnotationDetails({
  task_id,
}: GetPreAnnotationDetailsParams): Promise<{ data: PreAnnotationResponse }> {
  return await request.get(`/v1/tasks/${task_id}/pre_annotation_details`);
}

export async function getPreAnnotationDetail({
  task_id,
  sample_name,
}: GetPreAnnotationDetailParams): Promise<{ data: PreAnnotationResponse }> {
  return await request.get(`/v1/tasks/${task_id}/pre_annotation_detail`, {
    params: {
      sample_name: sample_name,
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
