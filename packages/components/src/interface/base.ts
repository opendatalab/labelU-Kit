import type { EToolName } from '@label-u/annotation';

// TODO
export interface AnnotationResult {
  attribute?: string;
  id: string;
  result?: Record<string, string>;
  order?: number;
  pointList?: number[];
}

export interface ToolResult {
  toolName: EToolName;
  result: AnnotationResult[];
}

export type BasicResult = Record<string, ToolResult> & {
  rotate: number;
  valid: boolean;
};

export interface SelectedResult extends AnnotationResult {
  id: string;
  toolName: string;
}

export interface ToolStyle {
  color: number;
  width: number;
  borderOpacity: number;
  fillOpacity: number;
}

export interface ImageAttribute {
  brightness: number;
  contrast: number;
  isOriginalSize: boolean;
  saturation: number;
  zoomRatio: number;
}
