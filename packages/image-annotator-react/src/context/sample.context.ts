import type { ToolName, AnnotationData } from '@labelu/image';
import { createContext, useContext } from 'react';

import type { GlobalAnnotationPayload } from './annotation.context';

export interface ImageSample {
  id: string | number;
  name?: string;
  url: string;
  meta?: {
    width: number;
    height: number;
    rotate: number;
  };
  data: Partial<GlobalAnnotationPayload> & Partial<Record<ToolName, AnnotationData[]>>;
}

export interface SampleContextType {
  currentSample: ImageSample | undefined;

  samples: ImageSample[];

  onSampleSelect: (sample: ImageSample) => void;
}

export const SampleContext = createContext<SampleContextType>({} as SampleContextType);

export function useSample() {
  const contextValue = useContext(SampleContext);

  if (Object.keys(contextValue).length === 0) {
    throw new Error('useSample must be used within a AnnotatorProvider');
  }

  return contextValue;
}
