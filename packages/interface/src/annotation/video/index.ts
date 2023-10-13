import type { AudioSegmentAnnotation } from '../audio';

/**
 * 视频片断分割
 *
 * @description
 * 与音频片断分割标注一致，组件层面其实与视频标注没有区别。
 * 但是在业务层面，音频片断分割与音频断分割是两种不同的标注类型，因此在上层的业务层需要区分。
 *
 * @see {@link AudioSegmentName}
 */
export type VideoSegmentName = 'segment';

/**
 * 视频帧标注
 *
 * @description 与视频分割同理
 *
 * @see {@link VideoSegmentName}
 * @see {@link AudioFrameName}
 */
export type VideoFrameName = 'frame';

/**
 * 视频的两种标注类型
 */
export type VideoAnnotationType = VideoSegmentName | VideoFrameName;

/**
 * 视频片断分割标注数据
 *
 * @see {@link AudioSegmentName}
 */
export type VideoSegmentAnnotation = AudioSegmentAnnotation;

/**
 * 视频时间戳标注数据
 */
export interface VideoFrameAnnotation extends Omit<VideoSegmentAnnotation, 'start' | 'end' | 'type'> {
  /**
   * 时间戳标注类型
   *
   * @see {@link VideoFrameName}
   */
  type: VideoFrameName;
  /**
   * 时间戳
   */
  time: number;
}

/**
 * 视频标注数据
 */
export type VideoAnnotationData = VideoSegmentAnnotation | VideoFrameAnnotation;
