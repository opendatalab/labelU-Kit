import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import type { SampleResponse } from '@/api/types';
import type { TaskLoaderResult } from '@/loaders/task.loader';

export interface AnnotationContextValue {
  samples: SampleResponse[];
  task: TaskLoaderResult['task'];
  setSamples: Dispatch<SetStateAction<SampleResponse[]>>;
  isEnd: boolean;
}

const AnnotationContext = React.createContext<AnnotationContextValue>({} as AnnotationContextValue);

export default AnnotationContext;
