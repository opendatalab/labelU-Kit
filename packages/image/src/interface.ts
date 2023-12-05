import type { LineData, PointData, RectData } from './annotation';
import type { LineTool, PointTool, RectTool } from './tools';

/**
 * 图片标注结果的基础字段
 */
export interface BasicImageAnnotation {
  id: string;

  /** 标注顺序 */
  order: number;

  /**
   * 是否有效
   *
   * @default true
   */
  valid?: boolean;

  /** 标签分类 */
  label?: string;

  /** 标签分类属性 */
  attributes?: Record<string, string | string[]>;
}

export type AnnotationData = LineData | PointData | RectData;

export type AnnotationTool = LineTool | PointTool | RectTool;

export type ToolName = 'line' | 'point' | 'polygon' | 'rect';

export type AnnotationToolData<T extends ToolName> = T extends 'line'
  ? LineData[]
  : T extends 'point'
  ? PointData[]
  : T extends 'rect'
  ? RectData[]
  : never;
