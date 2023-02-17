// @ts-ignore
import { createSlice } from '@reduxjs/toolkit';

const samplesSlice = createSlice({
  name: 'samples',
  initialState: {
    newSamples: [],
    currentSampleId: undefined,
    list: [],
  },
  reducers: {
    updateNewSamples: (state: any, action: any) => {
      state.newSamples = action.payload;
    },
    updateCurrentSampleId: (state: any, action: any) => {
      state.currentSampleId = action.payload;
    },

    setSamples: (state: any, action: any) => {
      state.list = action.payload;
    },
  },
});

export const { updateNewSamples, updateCurrentSampleId, setSamples } = samplesSlice.actions;

export default samplesSlice.reducer;
