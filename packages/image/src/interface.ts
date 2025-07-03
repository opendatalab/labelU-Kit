import type {
  CuboidData,
  LineData,
  LineGroup,
  PointData,
  PointGroup,
  PolygonData,
  PolygonGroup,
  RectData,
  RectGroup,
  RelationData,
} from './annotations';
import type { ClosedSpline, Line, Point, Polygon, Rect, Spline } from './shapes';
import type {
  CuboidTool,
  CuboidToolOptions,
  LineTool,
  LineToolOptions,
  PointTool,
  PointToolOptions,
  PolygonTool,
  PolygonToolOptions,
  RectTool,
  RectToolOptions,
  RelationTool,
  RelationToolOptions,
} from './tools';

export type EditType = 'create' | 'update' | 'delete';

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

  /**
   * 是否可见
   *
   * @default true
   */
  visible?: boolean;

  /** 标签分类 */
  label?: string;

  /** 标签分类属性 */
  attributes?: Record<string, string | string[]>;

  /**
   * 是否可编辑
   */
  requestEdit?: (
    type: EditType,
    payload: {
      toolName: ToolName;
      label: string;
    },
  ) => boolean;
}

export type ToolOptions =
  | LineToolOptions
  | PointToolOptions
  | RectToolOptions
  | PolygonToolOptions
  | CuboidToolOptions
  | RelationToolOptions;

export type { LineData };

export type AnnotationData = LineData | PointData | RectData | PolygonData | CuboidData | RelationData;

export type AllTypeAnnotationDataGroup = CuboidData[] &
  PolygonData[] &
  RectData[] &
  PointData[] &
  LineData[] &
  RelationData[];

export type AnnotationTool = LineTool | PointTool | RectTool | PolygonTool | CuboidTool | RelationTool;

export type AnnotationShape = Line | Point | Rect | Polygon | Spline | ClosedSpline;

export type ToolName = 'line' | 'point' | 'polygon' | 'rect' | 'cuboid' | 'relation';

export type AnnotationToolData<T extends ToolName> = T extends 'line'
  ? LineData[]
  : T extends 'point'
  ? PointData[]
  : T extends 'rect'
  ? RectData[]
  : T extends 'polygon'
  ? PolygonData[]
  : T extends 'cuboid'
  ? CuboidData[]
  : T extends 'relation'
  ? RelationData[]
  : never;

export type AnyTool = Map<ToolName, AnnotationTool>;
