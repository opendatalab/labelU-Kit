import axiosProxy from './axiosProxy';
import CommonController from '../utils/common/common';
const { axiosInstance } = axiosProxy;
const submitBasicConfig = async function (data: { name: string; description?: string; tips?: string }) {
  // try {
  const res = await axiosInstance({
    url: `/api/v1/tasks`,
    method: 'POST',
    data,
  });
  return res;
  // }catch (e) {
  //     CommonController.notificationErrorMessage(e, 5);
  // }
};

const uploadFile = async function (taskId: number, params: any) {
  try {
    const data = new FormData();
    data.append('file', params.file);
    // data.append('path', './')
    const res = await axiosInstance({
      url: `/api/v1/tasks/${taskId}/attachments`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      data,
    });
    return res;
  } catch (e) {
    CommonController.notificationErrorMessage(e, 5);
  }
};

const updateTaskConfig = async function (taskId: number, taskConfig: any) {
  try {
    const res = await axiosInstance({
      url: `/api/v1/tasks/${taskId}`,
      method: 'PATCH',
      data: taskConfig,
    });
    return res;
  } catch (e) {
    CommonController.notificationErrorMessage(e, 5);
  }
};

const getTaskList = async function (page: number) {
  try {
    const res = await axiosInstance({
      url: `/api/v1/tasks`,
      method: 'GET',
      params: {
        page,
        size: 16,
      },
    });
    return res;
  } catch (e) {
    CommonController.notificationErrorMessage(e, 5);
  }
};

const deleteTask = async function (taskId: number) {
  try {
    const res = await axiosInstance({
      url: `/api/v1/tasks/${taskId}`,
      method: 'DELETE',
      params: {
        task_id: taskId,
      },
    });
    return res;
  } catch (e) {
    CommonController.notificationErrorMessage(e, 5);
  }
};

export { submitBasicConfig, uploadFile, updateTaskConfig, getTaskList, deleteTask };
