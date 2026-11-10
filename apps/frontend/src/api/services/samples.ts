import commonController from '@/utils/common';

import request from '../request';
import { getTask } from './task';
import {
  type AutoLabelCommand,
  type BatchAutoLabelCommand,
  type AutoLabelJobResponse,
  ExportType,
  type DeleteApiV1TasksTaskIdDeleteParams,
  type DeleteSampleCommand,
  type GetApiV1TasksTaskIdSamplesSampleIdGetParams,
  type GetPreApiV1TasksTaskIdSamplesSampleIdPreGetParams,
  type ListByApiV1TasksTaskIdSamplesGetParams,
  type OkRespCommonDataResp,
  type OkRespCreateSampleResponse,
  type OkRespAutoLabelResponse,
  type OkRespSampleResponse,
  type PatchSampleCommand,
  type SampleData,
  type SampleListResponse,
  type SampleResponse,
  type UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams,
} from '../types';

export async function createSamples(
  taskId: number,
  data: {
    file_id: number;
    data: SampleData;
  }[],
): Promise<OkRespCreateSampleResponse> {
  return await request.post(`/v1/tasks/${taskId}/samples`, data);
}

export async function getSamples({
  task_id,
  ...params
}: ListByApiV1TasksTaskIdSamplesGetParams): Promise<SampleListResponse> {
  return await request.get(`/v1/tasks/${task_id}/samples`, {
    params: {
      ...params,
      page: typeof params.page === 'undefined' ? 0 : params.page - 1,
    },
  });
}

export async function getSample({
  task_id,
  sample_id,
}: GetApiV1TasksTaskIdSamplesSampleIdGetParams): Promise<OkRespSampleResponse> {
  return await request.get(`/v1/tasks/${task_id}/samples/${sample_id}`);
}

export async function updateSampleState(
  { task_id, sample_id, ...params }: UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams,
  body: PatchSampleCommand,
): Promise<SampleResponse> {
  return await request.patch(`/v1/tasks/${task_id}/samples/${sample_id}`, body, {
    params: {
      sample_id,
      ...params,
    },
  });
}

export async function updateSampleAnnotationResult(
  taskId: number,
  sampleId: number,
  data: SampleResponse,
): Promise<SampleResponse> {
  return await request.patch(
    `/v1/tasks/${taskId}/samples/${sampleId}`,
    {
      data: data.data,
      state: data.state,
      annotated_count: data.annotated_count,
    },
    {
      params: {
        sample_id: sampleId,
      },
    },
  );
}

export async function autoLabelSample(
  taskId: number,
  sampleId: number,
  body: AutoLabelCommand = {},
): Promise<OkRespAutoLabelResponse> {
  return await request.post(`/v1/tasks/${taskId}/samples/${sampleId}/auto_label`, body, {
    timeout: 5 * 60 * 1000,
    params: {
      sample_id: sampleId,
    },
  });
}

export async function createAutoLabelJob(
  taskId: number,
  body: BatchAutoLabelCommand = {},
): Promise<{ data: AutoLabelJobResponse }> {
  return await request.post(`/v1/tasks/${taskId}/auto_label_job`, body);
}

export async function getAutoLabelJobStatus(taskId: number, jobId: number): Promise<{ data: AutoLabelJobResponse }> {
  return await request.get(`/v1/tasks/${taskId}/auto_label_job/${jobId}`);
}

export async function outputSample(taskId: number, sampleIds: number[], activeTxt: ExportType) {
  // 1. Create export job
  const jobRes = await request.post(
    `/v1/tasks/${taskId}/samples/export`,
    { sample_ids: sampleIds },
    { params: { export_type: activeTxt } },
  );

  const jobId = jobRes.data.id;

  // 2. Poll until completed
  let job = jobRes.data;
  while (job.status !== 'COMPLETED' && job.status !== 'FAILED') {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusRes = await request.get(`/v1/tasks/${taskId}/samples/export/${jobId}`);
    job = statusRes.data;
  }

  if (job.status === 'FAILED') {
    commonController.notificationErrorMessage({ message: job.error_message || 'Export failed' }, 3);
    return;
  }

  // 3. Download the exported file
  const blob = await request.get(`/v1/tasks/${taskId}/samples/export/${jobId}/download`, {
    responseType: 'blob',
  });

  const taskRes = await getTask(taskId);
  let filename = taskRes.data.name || 'export';

  switch (activeTxt) {
    case ExportType.JSON:
    case ExportType.COCO:
      filename += '.json';
      break;
    case ExportType.XML:
      filename += '.xml';
      break;
    default:
      filename += '.zip';
      break;
  }

  const url = window.URL.createObjectURL(blob as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function outputSamples(taskId: number, activeTxt: ExportType) {
  const samplesRes = await getSamples({ task_id: taskId, page: 1, size: 100000 });
  const sampleIdArrays = samplesRes.data;
  const sampleIds = [];

  for (const sample of sampleIdArrays) {
    sampleIds.push(sample.id!);
  }

  if (sampleIds.length === 0) {
    commonController.notificationErrorMessage({ message: 'No samples to export' }, 1);
    return;
  }

  await outputSample(taskId, sampleIds, activeTxt);

  return true;
}

export async function deleteSamples(
  { task_id }: DeleteApiV1TasksTaskIdDeleteParams,
  body: DeleteSampleCommand,
): Promise<OkRespCommonDataResp> {
  return await request.delete(`/v1/tasks/${task_id}/samples`, {
    data: body,
  });
}

export async function getPreSample({
  sample_id,
  task_id,
}: GetPreApiV1TasksTaskIdSamplesSampleIdPreGetParams): Promise<OkRespSampleResponse> {
  return await request.get(`/v1/tasks/${task_id}/samples/${sample_id}/pre`);
}
