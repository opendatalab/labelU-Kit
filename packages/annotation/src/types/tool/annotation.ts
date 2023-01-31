import type { IBasicText } from './annotationView';
import type { IPoint } from './common';
import type { ILine } from './lineTool';
import type { IRect } from './rectTool';
import type { ITagResult } from './tagTool';

/**
 * 标注渲染样式
 */
export interface IAnnotationStyle {
  strokeColor: string;
  fillColor: string;
  textColor: string;
  toolColor: any;
}

/**
 * 数据渲染增强
 */
export interface IRenderEnhance {
  staticRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void; //
  selectedRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void;
  creatingRender?: (canvas: HTMLCanvasElement, data: any, style: IAnnotationStyle) => void;
}

/**
 * 创建时数据时的增强
 */
export type TDataInjectionAtCreateion = (data: IRect | IPoint | ILine | ITagResult | IBasicText) => Record<string, any>;
