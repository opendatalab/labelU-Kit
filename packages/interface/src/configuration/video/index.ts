import type { VideoAnnotationType, VideoFrameName, VideoSegmentName } from '../../annotation';
import type { Attribute } from '../attribute';

export interface VideoAnnotationToolConfig {
  attributes?: Attribute[];
  type: VideoAnnotationType;
}

export interface VideoSegmentToolConfig {
  attributes?: Attribute[];
  type: VideoSegmentName;
}

export interface VideoFrameToolConfig {
  attributes?: Attribute[];
  type: VideoFrameName;
}
