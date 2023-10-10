import type { AttributeValue, LabelValue } from '../../base';

export type AudioSegmentName = 'segment';

export type AudioFrameName = 'frame';

export type AudioAnnotationType = AudioSegmentName | AudioFrameName;

export interface AudioSegmentAnnotation extends LabelValue {
  type: AudioSegmentName;
  id: string;
  start: number;
  end: number;
  attributes?: AttributeValue;
  order: number;
}

export interface AudioFrameAnnotation extends LabelValue {
  type: AudioFrameName;
  id: string;
  time: number;
  order: number;
  attributes?: AttributeValue;
}

export type AudioAnnotationData = AudioSegmentAnnotation | AudioFrameAnnotation;
