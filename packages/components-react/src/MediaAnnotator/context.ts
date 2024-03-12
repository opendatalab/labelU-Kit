import type {
  Attribute,
  VideoFrameName,
  VideoSegmentName,
  MediaAnnotationInUI,
  AttributeOption,
} from '@labelu/interface';
import { createContext, useContext } from 'react';

export interface MediaAnnotationContextType {
  selectedAnnotation: MediaAnnotationInUI | undefined;
  selectAnnotation: (annotation: MediaAnnotationInUI) => void;
  duration: number;
  annotations: MediaAnnotationInUI[];
  showOrder: boolean;
  onChange?: (annotation: MediaAnnotationInUI) => void;
  onAnnotationChange: (annotation: MediaAnnotationInUI) => void;
  attributeConfigMapping: Record<
    VideoSegmentName | VideoFrameName,
    Record<
      string,
      Attribute & {
        attributesMapping?: Record<
          string,
          Attribute & {
            optionMapping?: Record<string, AttributeOption>;
          }
        >;
      }
    >
  >;
  playingAnnotationIds: string[];
  setCurrentTime: (time: number) => void;
  getCurrentTime: () => number;
  requestEdit?: (
    type: EditType,
    payload: {
      toolName: 'segment' | 'frame' | undefined;
      label?: string;
    },
  ) => boolean;
}

export type EditType = 'create' | 'update' | 'delete';

export const MediaAnnotationContext = createContext<MediaAnnotationContextType>({} as MediaAnnotationContextType);

export function useMediaAnnotator() {
  const contextValue = useContext(MediaAnnotationContext);

  if (Object.keys(contextValue).length === 0) {
    throw new Error('useMediaAnnotator must be used within a MediaAnnotatorProvider');
  }

  return contextValue;
}
