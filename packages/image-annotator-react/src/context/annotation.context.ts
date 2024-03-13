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

export type AllAnnotationType = TextAnnotationType | TagAnnotationType | ToolName;

export type AnnotationWithTool = (GlobalAnnotation | AnnotationData) & { tool: AllAnnotationType };

export type AllAnnotationMapping = Record<
  string,
  (GlobalAnnotation | AnnotationData) & {
    tool: TextAnnotationType | TagAnnotationType | ToolName;
  }
>;

export interface AnnotationContextType {
  annotationsWithGlobal: AllAnnotationMapping;

  sortedImageAnnotations: AnnotationDataInUI[];

  selectedAnnotation: AnnotationDataInUI | undefined;

  preAnnotationsWithGlobal?: Partial<Record<AllAnnotationType, AnnotationData[] | GlobalAnnotation[]>>;

  allAnnotationsMapping: AllAnnotationMapping;

  // onImageAnnotationChange: (annotation: AnnotationDataInUI) => void;

  onAnnotationsChange: (annotations: AnnotationWithTool[]) => void;

  onAnnotationChange: (annotation: AnnotationWithTool) => void;

  // onGlobalAnnotationsChange: (annotations: GlobalAnnotationPayload) => void;

  onAnnotationClear: () => void;

  // onGlobalAnnotationClear: () => void;

  // onImageAnnotationsClear: () => void;

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
