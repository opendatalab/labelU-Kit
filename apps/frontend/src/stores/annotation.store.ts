// @ts-ignore
import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit';

const annotationSlice = createSlice({
  name: 'annotation',
  initialState: {
    annotationDatas: '',
  },
  reducers: {
    updateAnnotationDatas: (state: any, action: any) => {
      state.annotationDatas = action.payload;
    },
  },
});

export const { updateAnnotationDatas } = annotationSlice.actions;

export default annotationSlice.reducer;
