// @ts-ignore
import { createSlice } from '@reduxjs/toolkit';

import type { SamplePayload } from '@/services/interface';

export interface SamplesState {
  newSamples: SamplePayload[];
  list: SamplePayload[];
  currentSampleId?: number;
}

const samplesSlice = createSlice({
  name: 'samples',
  initialState: {
    newSamples: [],
    currentSampleId: undefined,
    currentSample: {} as SamplePayload,
    list: [],
  },
  reducers: {
    updateNewSamples: (state: any, action: any) => {
      state.newSamples = action.payload;
    },
    updateCurrentSampleId: (state: any, action: any) => {
      state.currentSampleId = action.payload;
    },

    updateCurrentSample: (state: any, action: any) => {
      state.currentSample = action.payload;
    },

    setSamples: (state: any, action: any) => {
      state.list = action.payload;
    },
  },
});

export const { updateNewSamples, updateCurrentSampleId, updateCurrentSample, setSamples } = samplesSlice.actions;

export default samplesSlice.reducer;
