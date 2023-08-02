import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import type { SampleResponse } from '@/services/types';

export interface AnnotationContextValue {
  samples: SampleResponse[];
  setSamples: Dispatch<SetStateAction<SampleResponse[]>>;
  isEnd: boolean;
}

const AnnotationContext = React.createContext<AnnotationContextValue>({} as AnnotationContextValue);

export default AnnotationContext;
