import type { AnnotationData, ToolName } from '@labelu/image';
import type {
  TextAnnotationEntity,
  TagAnnotationEntity,
  TextAnnotationType,
  TagAnnotationType,
} from '@labelu/interface';
import { createContext, useContext } from 'react';

export type GlobalAnnotation = TextAnnotationEntity | TagAnnotationEntity;

export type GlobalAnnotationPayload = Record<TextAnnotationType | TagAnnotationType, GlobalAnnotation[]>;

export type AnnotationDataInUI = AnnotationData & {
  tool: ToolName;
};

export interface AnnotationsWithGlobal {
  /** 已根据order排序的图片标注数据 */
  image: Record<ToolName, AnnotationDataInUI[]>;

  global: GlobalAnnotationPayload;
}

export interface AnnotationContextType {
  annotationsWithGlobal: AnnotationsWithGlobal;

  sortedImageAnnotations: AnnotationDataInUI[];

  selectedAnnotation: AnnotationDataInUI | undefined;

  preAnnotationsWithGlobal?: Partial<
    Record<ToolName | TextAnnotationType | TagAnnotationType, AnnotationData[] | GlobalAnnotation[]>
  >;

  allAnnotationsMapping: Record<string, AnnotationDataInUI>;

  onImageAnnotationChange: (annotation: AnnotationDataInUI) => void;

  onImageAnnotationsChange: (annotations: AnnotationDataInUI[]) => void;

  onGlobalAnnotationsChange: (annotations: GlobalAnnotationPayload) => void;

  onGlobalAnnotationClear: () => void;

  onImageAnnotationsClear: () => void;

  orderVisible: boolean;

  onOrderVisibleChange: (visible: boolean) => void;
}

export const AnnotationContext = createContext<AnnotationContextType>({} as AnnotationContextType);

export function useAnnotationCtx() {
  const contextValue = useContext(AnnotationContext);

  if (Object.keys(contextValue).length === 0) {
    throw new Error('useAnnotationCtx must be used within a AnnotationContext.Provider');
  }

  return contextValue;
}
