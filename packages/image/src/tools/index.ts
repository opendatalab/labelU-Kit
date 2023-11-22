import type { LineData } from './LineTool';

export * from './LineTool';

export type AnnotationData = LineData;

export type ToolName = 'line' | 'point' | 'polygon' | 'rect';

export type AnnotationToolData<T extends ToolName> = T extends 'line' ? LineData[] : never;
