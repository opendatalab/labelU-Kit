import type {
  LineData,
  LineGroup,
  PointData,
  PointGroup,
  PolygonData,
  PolygonGroup,
  RectData,
  RectGroup,
} from './annotation';
import type { ClosedSpline, Line, Point, Polygon, Rect, Spline } from './shapes';
import type {
  LineTool,
  LineToolOptions,
  PointTool,
  PointToolOptions,
  PolygonTool,
  PolygonToolOptions,
  RectTool,
  RectToolOptions,
} from './tools';

export type GroupInAnnotation = LineGroup | PointGroup | PolygonGroup | RectGroup;

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

export type ToolOptions = LineToolOptions | PointToolOptions | RectToolOptions | PolygonToolOptions;

export type AnnotationData = LineData | PointData | RectData | PolygonData;

export type AnnotationTool = LineTool | PointTool | RectTool | PolygonTool;

export type AnnotationShape = Line | Point | Rect | Polygon | Spline | ClosedSpline;

export type ToolName = 'line' | 'point' | 'polygon' | 'rect';

export type AnnotationToolData<T extends ToolName> = T extends 'line'
  ? LineData[]
  : T extends 'point'
  ? PointData[]
  : T extends 'rect'
  ? RectData[]
  : T extends 'polygon'
  ? PolygonData[]
  : never;
