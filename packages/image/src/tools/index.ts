import type { LineData, LineTool } from './LineTool';
import type { PointData, PointTool } from './PointTool';

export * from './LineTool';
export * from './PointTool';

export type AnnotationData = LineData | PointData;

export type AnnotationTool = LineTool | PointTool;

export type ToolName = 'line' | 'point' | 'polygon' | 'rect';

export type AnnotationToolData<T extends ToolName> = T extends 'line'
  ? LineData[]
  : T extends 'point'
  ? PointData[]
  : never;
