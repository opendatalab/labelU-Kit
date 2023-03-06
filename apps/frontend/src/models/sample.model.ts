import { createModel } from '@rematch/core';

import { deleteSamples, getPreSample, getSample, getSamples, updateSampleState } from '@/services/samples';
import type {
  DeleteSampleCommand,
  GetApiV1TasksTaskIdSamplesSampleIdGetParams,
  GetPreApiV1TasksTaskIdSamplesSampleIdPreGetParams,
  ListByApiV1TasksTaskIdSamplesGetParams,
  PatchSampleCommand,
  SampleListResponse,
  SampleResponse,
  UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams,
} from '@/services/types';

import type { RootModel } from './index';

export const sample = createModel<RootModel>()({
  state: {
    list: [] as unknown as SampleListResponse,
    item: {} as SampleResponse,
    pre: {} as unknown as SampleResponse,
  },

  reducers: {
    setSamples: (state, payload: SampleListResponse) => {
      return {
        ...state,
        list: payload,
      };
    },

    setSample: (state, payload: SampleResponse) => {
      return {
        ...state,
        item: payload,
      };
    },

    setPreSample: (state, payload: SampleResponse) => {
      return {
        ...state,
        pre: payload,
      };
    },
  },

  effects: (dispatch) => ({
    async fetchSamples(params: ListByApiV1TasksTaskIdSamplesGetParams) {
      dispatch.sample.setSamples(await getSamples(params));
    },

    async fetchSample(params: GetApiV1TasksTaskIdSamplesSampleIdGetParams) {
      const { data } = await getSample(params);
      dispatch.sample.setSample(data);
    },

    async fetchPreSample(params: GetPreApiV1TasksTaskIdSamplesSampleIdPreGetParams) {
      const { data } = await getPreSample(params);
      dispatch.setPreSample(data);
    },

    async deleteSamples({ task_id, body }: { task_id: number; body: DeleteSampleCommand }) {
      await deleteSamples({ task_id }, body);
    },

    async updateSampleState({
      params,
      body,
    }: {
      params: UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams;
      body: PatchSampleCommand;
    }) {
      await updateSampleState(params, body);
      // 更新完状态后重新获取样本列表
      await dispatch.sample.fetchSamples(params);
    },
  }),
});
