import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import type { SampleResponse, TaskResponse } from '@/services/types';

export interface AnnotationContextValue {
  samples: SampleResponse[];
  task: TaskResponse;
  setSamples: Dispatch<SetStateAction<SampleResponse[]>>;
  isEnd: boolean;
}

const AnnotationContext = React.createContext<AnnotationContextValue>({} as AnnotationContextValue);

export default AnnotationContext;
