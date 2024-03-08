import type { Attribute, EnumerableAttribute, TextAttribute } from '@labelu/interface';
import { createContext, useContext } from 'react';

import type { AnnotationsWithGlobal } from './annotation.context';

export interface MediaAnnotatorConfig {
  // 标签分类
  tag?: EnumerableAttribute[];
  // 文本描述
  text?: TextAttribute[];
  // 分割工具
  segment?: Attribute[];
  // 帧工具
  frame?: Attribute[];
}

export interface MediaSample {
  id: string | number;
  name?: string;
  url: string;
  data: AnnotationsWithGlobal;
  meta?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

export interface SampleContextType {
  currentSample?: MediaSample;

  samples: MediaSample[];

  onSampleSelect: (sample: MediaSample) => void;
}

export const SampleContext = createContext<SampleContextType>({} as SampleContextType);

export function useSample() {
  const contextValue = useContext(SampleContext);

  if (Object.keys(contextValue).length === 0) {
    throw new Error('useSample must be used within a AnnotatorProvider');
  }

  return contextValue;
}
