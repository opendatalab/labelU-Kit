import type { AttributeValue, LabelValue } from '../../base';

export type VideoSegmentName = 'segment';

export type VideoFrameName = 'frame';

export type VideoAnnotationType = VideoSegmentName | VideoFrameName;

export interface VideoSegmentAnnotation extends LabelValue {
  type: VideoSegmentName;
  id: string;
  start: number;
  end: number;
  attributes?: AttributeValue;
  order: number;
}

export interface VideoFrameAnnotation extends LabelValue {
  type: VideoFrameName;
  id: string;
  time: number;
  order: number;
  attributes?: AttributeValue;
}

export type VideoAnnotationData = VideoSegmentAnnotation | VideoFrameAnnotation;
