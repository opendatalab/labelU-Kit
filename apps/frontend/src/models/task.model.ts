import { createModel } from '@rematch/core';

import type {
  TaskResponseWithStatics,
  TaskListResponseWithStatics,
  ListByApiV1TasksGetParams,
  UpdateCommand,
  BasicConfigCommand,
  TaskResponse,
} from '@/services/types';
import { createTaskWithBasicConfig, deleteTask, getTask, getTaskList, updateTaskConfig } from '@/services/task';
import type { ToolsConfigState } from '@/types/toolConfig';
import { jsonParse } from '@/utils';

import type { RootModel } from './index';

export const task = createModel<RootModel>()({
  state: {
    list: [] as unknown as TaskListResponseWithStatics,
    item: {} as TaskResponseWithStatics,
    new: {} as TaskResponse,
    config: {} as ToolsConfigState,
  },

  reducers: {
    setTasks: (state, payload: TaskListResponseWithStatics) => {
      return {
        ...state,
        list: payload,
      };
    },

    setTask: (state, payload: TaskResponseWithStatics) => {
      const parsedConfig = payload.config ? jsonParse(payload.config) : undefined;

      return {
        ...state,
        item: payload,
        config: parsedConfig,
      };
    },

    mergeTask: (state, payload: TaskResponseWithStatics) => {
      const parsedConfig = payload.config ? jsonParse(payload.config) : undefined;

      return {
        ...state,
        item: {
          ...state.item,
          ...payload,
        },
        config: parsedConfig,
      };
    },

    setNewTask: (state, payload: TaskResponse) => {
      return {
        ...state,
        new: payload,
      };
    },

    setConfig: (state, payload: ToolsConfigState) => {
      return {
        ...state,
        config: payload,
      };
    },

    // 当新建或编辑任务时，页面卸载时清空任务信息
    clearTaskItemAndConfig: (state) => {
      return {
        ...state,
        item: {} as TaskResponseWithStatics,
        new: {} as TaskResponse,
        config: {} as ToolsConfigState,
      };
    },
  },

  effects: (dispatch) => ({
    async fetchTasks(params: ListByApiV1TasksGetParams) {
      dispatch.task.setTasks(await getTaskList(params));
    },

    async fetchTask(taskId: number) {
      const { data } = await getTask(taskId);

      dispatch.task.setTask(data);
    },

    async updateTaskConfig({
      taskId,
      body,
    }: {
      taskId: number;
      body: Omit<UpdateCommand, 'config'> & { config: ToolsConfigState };
    }) {
      const { data } = await updateTaskConfig(taskId, {
        ...body,
        config: body.config ? JSON.stringify(body.config) : undefined,
      });

      dispatch.task.mergeTask(data);
    },

    async createTask(body: BasicConfigCommand) {
      const { data } = await createTaskWithBasicConfig(body);

      dispatch.task.setNewTask(data);

      return data;
    },
    deleteTask,
  }),
});
