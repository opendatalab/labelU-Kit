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

import type { RootModel } from './index';

export const task = createModel<RootModel>()({
  state: {
    list: [] as unknown as TaskListResponseWithStatics,
    item: {} as TaskResponseWithStatics,
    new: {} as TaskResponse,
  },

  reducers: {
    setTasks: (state, payload: TaskListResponseWithStatics) => {
      return {
        ...state,
        list: payload,
      };
    },

    setTask: (state, payload: TaskResponseWithStatics) => {
      return {
        ...state,
        item: payload,
      };
    },

    setNewTask: (state, payload: TaskResponse) => {
      return {
        ...state,
        new: payload,
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

    async updateTaskConfig({ taskId, config }: { taskId: number; config: UpdateCommand }) {
      const { data } = await updateTaskConfig(taskId, config);

      dispatch.task.setTask(data);
    },

    async createTask(body: BasicConfigCommand) {
      const { data } = await createTaskWithBasicConfig(body);

      dispatch.task.setNewTask(data);
    },

    deleteTask,
  }),
});
