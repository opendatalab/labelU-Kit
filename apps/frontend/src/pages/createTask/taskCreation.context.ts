import React from 'react';

import type { BasicConfigCommand, TaskResponse } from '@/services/types';
import type { ToolsConfigState } from '@/types/toolConfig';

import type { QueuedFile } from './partials/inputData';

export interface TaskFormData extends BasicConfigCommand {
  config: ToolsConfigState;
}

export interface TaskCreationContextValue {
  task: TaskResponse;
  uploadFileList: QueuedFile[];
  setUploadFileList: React.Dispatch<React.SetStateAction<QueuedFile[]>>;
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  updateFormData: (field: string) => (value: any) => void;
}

export const TaskCreationContext = React.createContext<TaskCreationContextValue>({} as TaskCreationContextValue);
