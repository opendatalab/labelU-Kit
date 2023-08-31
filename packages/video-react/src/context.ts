import type { Attribute, VideoAnnotationData, VideoFrameName, VideoSegmentName } from '@label-u/interface';
import { createContext } from 'react';

export type VideoAnnotationInUI = VideoAnnotationData & {
  visible?: boolean;
};

export interface VideoAnnotationContextType {
  selectedAnnotation: VideoAnnotationInUI | undefined;
  selectAnnotation: (annotation: VideoAnnotationInUI) => void;
  editingAnnotation: VideoAnnotationInUI | null;
  duration: number;
  showOrder: boolean;
  playerRef: any;
  onChange?: (annotation: VideoAnnotationInUI) => void;
  onAnnotationChange: (annotation: VideoAnnotationInUI) => void;
  attributeConfigMapping: Record<VideoSegmentName | VideoFrameName, Record<string, Attribute>>;
  playingAnnotationIds: string[];
}

const VideoAnnotationContext = createContext<VideoAnnotationContextType>({} as VideoAnnotationContextType);

export default VideoAnnotationContext;
