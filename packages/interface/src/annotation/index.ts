import type {
  AudioAnnotationData,
  AudioAnnotationInUI,
  AudioAnnotationType,
  AudioFrameAnnotation,
  AudioSegmentAnnotation,
} from './audio';
import type {
  VideoAnnotationData,
  VideoAnnotationInUI,
  VideoAnnotationType,
  VideoFrameAnnotation,
  VideoSegmentAnnotation,
} from './video';

export * from './graphic';
export * from './video';
export * from './audio';
export * from './others';

/** 标注数据在UI层的表示 */
export type MediaAnnotationInUI = VideoAnnotationInUI | AudioAnnotationInUI;

/** 多媒体标注数据类型 */
export type MediaAnnotationType = VideoAnnotationType | AudioAnnotationType;

/** 多媒体标注数据 */
export type MediaAnnotationData = VideoAnnotationData | AudioAnnotationData;

/** 多媒体标注片断 */
export type MediaSegment = VideoSegmentAnnotation | AudioSegmentAnnotation;

/** 多媒体标注时间戳 */
export type MediaFrame = VideoFrameAnnotation | AudioFrameAnnotation;
