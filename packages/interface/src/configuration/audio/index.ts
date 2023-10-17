import type { AudioAnnotationType, AudioFrameName, AudioSegmentName } from '../../annotation';
import type { Attribute } from '../attribute';

/**
 * 音频标注工具配置
 */
export interface AudioAnnotationToolConfig {
  /** 标注类型 */
  type: AudioAnnotationType;
  /** 标签属性列表 */
  attributes?: Attribute[];
}

/**
 * 音频片断分割工具配置
 */
export interface AudioSegmentToolConfig {
  /** 标注类型 */
  type: AudioSegmentName;
  /** 标签属性列表 */
  attributes?: Attribute[];
}

/**
 * 音频时间戳标注工具配置
 */
export interface AudioFrameToolConfig {
  /** 标注类型 */
  type: AudioFrameName;
  /** 标签属性列表 */
  attributes?: Attribute[];
}
