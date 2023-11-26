import { EInternalEvent } from '../enums';
import type { BasicToolParams } from '../tools/Tool';
import type { LineStyle } from '../shape/Line.shape';
import type { BasicImageAnnotation } from '../interface';
import type { Drawing } from './Drawing.abstract';
import type { AxisPoint } from '../shape/Point.shape';
import type { LineTool } from '../tools/Line.tool';
import { AnnotationLine } from '../annotation';
import { eventEmitter } from '../singletons';

export interface LineData extends BasicImageAnnotation {
  pointList: PointItem[];
}

export interface PointItem extends AxisPoint {
  id: string;
}

export interface LineToolOptions extends BasicToolParams<LineData, LineStyle> {
  /**
   * 线条类型
   * @description
   * - line: 直线
   * - curve: 曲线
   * @default 'line'
   */
  lineType?: 'line' | 'curve';

  /**
   * 边缘吸附
   * @default true;
   */
  edgeAdsorptive?: boolean;

  /**
   * 画布外标注
   * @default true;
   */
  outOfCanvas?: boolean;

  /**
   * 闭合点个数
   * @description 至少两个点
   * @default 2
   */
  closingPointAmount?: number;
}

export class LineDrawing implements Drawing<LineData, LineTool, AnnotationLine> {
  /** 元素集合 */
  private _annotationMapping: Map<string, AnnotationLine> = new Map();

  /** 端点对标注id的映射 */
  private _pointAnnotationMapping: Map<string, string> = new Map();

  public data: LineData[] = [];

  public tool: LineTool;

  constructor(data: LineData[], tool: LineTool) {
    this.data = data;
    this.tool = tool;

    this._init();
  }

  private _init() {
    this._buildMappings();

    eventEmitter.on(EInternalEvent.Render, this.render.bind(this));
  }

  private _buildMappings() {
    const { data = [], tool, _annotationMapping } = this;

    for (const annotation of data) {
      _annotationMapping.set(annotation.id, new AnnotationLine(annotation.id, annotation, tool));

      for (const point of annotation.pointList) {
        this._pointAnnotationMapping.set(point.id, annotation.id);
      }
    }
  }

  public destroy() {
    eventEmitter.off(EInternalEvent.Render, this.render.bind(this));

    this._annotationMapping.forEach((element) => {
      element.destroy();
    });

    this._annotationMapping.clear();
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { _annotationMapping } = this;

    _annotationMapping.forEach((element) => {
      element.render(ctx);
    });
  }

  public get annotationMapping() {
    return this._annotationMapping;
  }

  public get pointAnnotationMapping() {
    return this._pointAnnotationMapping;
  }
}
