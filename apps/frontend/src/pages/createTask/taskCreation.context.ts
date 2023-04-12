import React from 'react';
import type { FormInstance } from 'antd';

import type { TaskResponse } from '@/services/types';

import type { QueuedFile } from './partials/inputData';

export interface TaskCreationContextValue {
  task: TaskResponse;
  uploadFileList: QueuedFile[];
  setUploadFileList: React.Dispatch<React.SetStateAction<QueuedFile[]>>;
  annotationFormInstance: FormInstance;
  basicFormInstance: FormInstance;
  onAnnotationFormChange: () => void;
}

export const TaskCreationContext = React.createContext<TaskCreationContextValue>({} as TaskCreationContextValue);
