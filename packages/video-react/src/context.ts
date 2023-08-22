import { createContext } from 'react';

import type { VideoAnnotation } from './AnnotationBar';

export interface VideoAnnotationContextType {
  selectedAnnotation: VideoAnnotation | null;
  selectAnnotation: (annotation: VideoAnnotation) => void;
  editingAnnotation: VideoAnnotation | null;
  duration: number;
  playerRef: any;
  onChange?: (annotation: VideoAnnotation[]) => void;
  onAnnotationChange: (annotation: VideoAnnotation) => void;
  attributeConfigMapping: Record<string, any>;
}

const VideoAnnotationContext = createContext<VideoAnnotationContextType>({} as VideoAnnotationContextType);

export default VideoAnnotationContext;
