import type { AudioAnnotationType, AudioFrameName, AudioSegmentName } from '../../annotation';
import type { Attribute } from '../attribute';

export interface AudioAnnotationToolConfig {
  attributes?: Attribute[];
  type: AudioAnnotationType;
}

export interface AudioSegmentToolConfig {
  attributes?: Attribute[];
  type: AudioSegmentName;
}

export interface AudioFrameToolConfig {
  attributes?: Attribute[];
  type: AudioFrameName;
}
