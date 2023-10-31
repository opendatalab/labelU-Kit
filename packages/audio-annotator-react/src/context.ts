import type {
  Attribute,
  VideoSegmentToolConfig,
  VideoFrameToolConfig,
  VideoAnnotationType,
  EnumerableAttribute,
  TextAttribute,
  MediaAnnotationInUI,
  MediaAnnotationWithTextAndTag,
} from '@labelu/interface';
import { createContext, useContext } from 'react';

export interface AudioAnnotatorConfig {
  // 标签分类
  tag?: EnumerableAttribute[];
  // 文本描述
  text?: TextAttribute[];
  // 分割工具
  segment: VideoSegmentToolConfig;
  // 帧工具
  frame: VideoFrameToolConfig;
}

export interface MediaSample {
  id: string | number;
  name?: string;
  url: string;
  annotations: MediaAnnotationWithTextAndTag[];
  meta?: {
    width: number;
    height: number;
    duration: number;
  };
}
export interface AnnotatorContextType {
  currentTool: VideoAnnotationType | undefined;
  samples: MediaSample[];
  config?: AudioAnnotatorConfig;
  annotations: MediaAnnotationInUI[];
  attributes: Attribute[];
  containerRef: React.RefObject<HTMLDivElement>;
  orderVisible: boolean;
  currentSample?: MediaSample;
  attributeMapping: Record<string, Record<string, Attribute>>;
  annotationsMapping: Record<string, MediaAnnotationWithTextAndTag>;
  selectedAnnotation: MediaAnnotationInUI | undefined;
  selectedAttribute: Attribute | undefined;
  handleSelectSample: (sample: MediaSample) => void;
  onToolChange: (tool?: VideoAnnotationType) => void;
  onLabelChange: (attribute: Attribute) => void;
  onAnnotationRemove: (annotation: MediaAnnotationInUI) => void;
  onAnnotationsRemove: (annotations: MediaAnnotationWithTextAndTag[]) => void;
  onAnnotationSelect: (annotation: MediaAnnotationInUI) => void;
  onAnnotationChange: (annotation: MediaAnnotationInUI) => void;
  onOrderVisibleChange: (visible: boolean) => void;
  onAttributeChange: (payload: any) => void;
  onAnnotationsChange: (annotations: MediaAnnotationWithTextAndTag[]) => void;
  redo: () => void;
  undo: () => void;
  pastRef: React.RefObject<MediaSample[]>;
  futureRef: React.RefObject<MediaSample[]>;
  getCurrentTime: () => number;
  setCurrentTime: (time: number) => void;
  getDuration: () => number;
  pause: () => void;
  play: () => void;
}

export const AnnotatorContext = createContext<AnnotatorContextType>({} as AnnotatorContextType);

export function useAnnotator() {
  const contextValue = useContext(AnnotatorContext);

  if (Object.keys(contextValue).length === 0) {
    throw new Error('useAnnotator must be used within a AnnotatorProvider');
  }

  return contextValue;
}
