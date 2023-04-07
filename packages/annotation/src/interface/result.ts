import type { EToolName } from '@/constant/tool';
import type { ILine } from '@/types/tool/lineTool';
import type { IPointUnit } from '@/types/tool/pointTool';
import type { IPolygonData } from '@/types/tool/polygon';
import type { IRect } from '@/types/tool/rectTool';
import type { ITagResult } from '@/types/tool/tagTool';
import type { ITextResult } from '@/types/tool/textTool';

export type AnnotationResult = ITagResult | IRect | IPointUnit | ILine | ITextResult | IPolygonData;

export interface ToolResult {
  toolName: EToolName;
  result: AnnotationResult[];
}

export type BasicResult = Record<string, ToolResult> & {
  rotate: number;
  valid: boolean;
};
