import type { LineData } from './drawing/Line.drawing';
import type { LineTool } from './tools';
import type { PointData } from './tools/Point.tool';

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

export type AnnotationData = LineData | PointData;

export type AnnotationTool = LineTool;

export type ToolName = 'line' | 'point' | 'polygon' | 'rect';

export type AnnotationToolData<T extends ToolName> = T extends 'line'
  ? LineData[]
  : T extends 'point'
  ? PointData[]
  : never;
