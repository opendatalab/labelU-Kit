import type { AudioAnnotationToolConfig, AudioFrameToolConfig, AudioSegmentToolConfig } from '../audio';

/**
 * 视频标注工具配置
 *
 * @description 与音频标注工具配置一致
 *
 * @see {@link AudioAnnotationToolConfig}
 */
export type VideoAnnotationToolConfig = AudioAnnotationToolConfig;

/**
 * 视频片断分割工具配置
 *
 * @description 与音频片断分割工具配置一致
 *
 * @see {@link AudioSegmentToolConfig}
 */
export type VideoSegmentToolConfig = AudioSegmentToolConfig;

/**
 * 视频时间戳标注工具配置
 *
 * @description 与音频时间戳标注工具配置一致
 *
 * @see {@link AudioFrameToolConfig}
 */
export type VideoFrameToolConfig = AudioFrameToolConfig;
