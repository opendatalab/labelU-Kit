import type { EToolName, AnnotationResult } from '@label-u/annotation';

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
