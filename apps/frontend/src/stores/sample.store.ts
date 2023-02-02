// @ts-ignore
import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit';

const samplesSlice = createSlice({
  name: 'samples',
  initialState: {
    newSamples: [],
    currentSampleId: undefined,
  },
  reducers: {
    updateNewSamples: (state: any, action: any) => {
      state.newSamples = action.payload;
    },
    updateCurrentSampleId: (state: any, action: any) => {
      state.currentSampleId = action.payload;
    },
  },
});

export const { updateNewSamples, updateCurrentSampleId } = samplesSlice.actions;

export default samplesSlice.reducer;
