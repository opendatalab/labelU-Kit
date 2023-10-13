import type { LabelValue } from '../../base';

/**
 * 音频片断分割
 */
export type AudioSegmentName = 'segment';

/**
 * 音频时间戳标注
 */
export type AudioFrameName = 'frame';

/**
 * 音频标注类型
 */
export type AudioAnnotationType = AudioSegmentName | AudioFrameName;

/**
 * 音频片断分割标注数据
 */
export interface AudioSegmentAnnotation extends LabelValue {
  /**
   * 片断分割标注类型
   */
  type: AudioSegmentName;
  /**
   * 标注id
   */
  id: string;
  /**
   * 开始时间
   */
  start: number;
  /**
   * 结束时间
   */
  end: number;
  /**
   * 标注顺序
   */
  order: number;
}

/**
 * 音频时间戳标注数据
 */
export interface AudioFrameAnnotation extends Omit<AudioSegmentAnnotation, 'start' | 'end' | 'type'> {
  /**
   * 时间戳标注类型
   */
  type: AudioFrameName;
  /**
   * 时间戳
   */
  time: number;
}

export type AudioAnnotationData = AudioSegmentAnnotation | AudioFrameAnnotation;
