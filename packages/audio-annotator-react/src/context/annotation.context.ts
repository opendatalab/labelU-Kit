import type {
  TextAnnotationEntity,
  TagAnnotationEntity,
  TextAnnotationType,
  TagAnnotationType,
  MediaAnnotationInUI,
  MediaAnnotationType,
  MediaAnnotationData,
  MediaAnnotationWithTextAndTag,
} from '@labelu/interface';
import { createContext, useContext } from 'react';

export type GlobalAnnotation = TextAnnotationEntity | TagAnnotationEntity;

export type MediaAnnotationTypeWithGlobal = MediaAnnotationType | TextAnnotationType | TagAnnotationType;

export type GlobalAnnotationPayload = Record<TextAnnotationType | TagAnnotationType, GlobalAnnotation[]>;

export type AnnotationsWithGlobal = Partial<GlobalAnnotationPayload> &
  Partial<Record<MediaAnnotationType, MediaAnnotationInUI[]>>;

export type AllAnnotationMapping = Record<string, MediaAnnotationInUI | TextAnnotationEntity | TagAnnotationEntity>;

export interface AnnotationContextType {
  annotationsWithGlobal: AllAnnotationMapping;

  sortedMediaAnnotations: MediaAnnotationInUI[];

  selectedAnnotation: MediaAnnotationInUI | undefined;

  preAnnotationsWithGlobal?: Partial<Record<MediaAnnotationTypeWithGlobal, MediaAnnotationData[] | GlobalAnnotation[]>>;

  allAnnotationsMapping: Record<string, MediaAnnotationInUI | TextAnnotationEntity | TagAnnotationEntity>;

  onAnnotationClear: () => void;

  onAnnotationsChange: (annotations: MediaAnnotationWithTextAndTag[]) => void;

  onAnnotationChange: (annotation: MediaAnnotationInUI) => void;

  onAnnotationSelect: (annotation: MediaAnnotationInUI) => void;

  onAnnotationsRemove: (annotations: MediaAnnotationWithTextAndTag[]) => void;

  onAnnotationRemove: (annotation: MediaAnnotationInUI) => void;

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
