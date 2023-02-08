// @ts-ignore
import { createSlice } from '@reduxjs/toolkit';

const existTaskSlice = createSlice({
  name: 'existTask',
  initialState: {
    taskId: 0,
    taskName: '',
    taskDescription: '',
    taskTips: '',
    configStep: -1,
    haveConfigedStep: 0,
    status: 'DRAFT',
    config: '',
  },
  reducers: {
    updateStatus: (state: any, action: any) => {
      state.status = action.payload;
    },
    updateConfigStep: (state: any, action: any) => {
      state.configStep = action.payload;
    },
    updateHaveConfigedStep: (state: any, action: any) => {
      // if (action.payload > state.haveConfigedStep) {
      // }
      state.haveConfigedStep = action.payload;
    },
    updateTaskId(state: any, action: any) {
      state.taskId = action.payload;
    },
    updateTaskName(state: any, action: any) {
      state.taskName = action.payload;
    },
    updateTaskDescription(state: any, action: any) {
      state.taskDescription = action.payload;
    },
    updateTaskTips(state: any, action: any) {
      state.taskTips = action.payload;
    },
    updateTask(state: any, action: any) {
      const taskInfo = action.payload.data;
      const currentStatus = action.payload.configStatus;
      const { name, tips, description, config, status, id } = taskInfo;
      state.taskName = name;
      state.taskTips = tips;
      state.taskDescription = description;
      state.taskId = id;
      state.status = status;
      state.config = config;
      if (!status) {
        state.haveConfigedStep = 0;
        state.configStep = -1;
      }
      if (status === 'DRAFT') {
        state.haveConfigedStep = 1;
        state.configStep = -1;
      }
      if (status === 'IMPORTED' && currentStatus !== 3) {
        state.haveConfigedStep = 2;
        state.configStep = 0;
        // state.configStep = 1;
      }
      if (status === 'IMPORTED' && currentStatus === 3) {
        state.haveConfigedStep = 2;
        // state.configStep = 0;
        state.configStep = 1;
      }

      if (status === 'CONFIGURED' && currentStatus === 1) {
        state.haveConfigedStep = 3;
        state.configStep = 0;
      }
      if (status === 'CONFIGURED' && currentStatus === 2) {
        state.haveConfigedStep = 3;
        state.configStep = 1;
      }
      if ((status === 'INPROGRESS' || status === 'FINISHED') && currentStatus === 1) {
        state.haveConfigedStep = 3;
        state.configStep = 0;
      }
      if ((status === 'INPROGRESS' || status === 'FINISHED') && currentStatus === 2) {
        state.haveConfigedStep = 3;
        state.configStep = 1;
      }
    },
  },
});

export const {
  updateTaskId,
  updateTaskName,
  updateTaskDescription,
  updateTaskTips,
  updateConfigStep,
  updateHaveConfigedStep,
  updateTask,
  updateStatus,
} = existTaskSlice.actions;

export default existTaskSlice.reducer;
