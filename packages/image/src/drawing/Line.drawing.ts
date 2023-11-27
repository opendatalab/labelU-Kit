import { EInternalEvent } from '../enums';
import type { BasicToolParams } from '../tools/Tool';
import type { LineStyle } from '../shape/Line.shape';
import type { LineTool } from '../tools/Line.tool';
import type { LineData } from '../annotation';
import { AnnotationLine } from '../annotation';
import { eventEmitter } from '../singletons';
import { Drawing, type IDrawing } from './Drawing';

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

export class LineDrawing extends Drawing<LineData, LineTool> implements IDrawing<LineData, LineTool> {
  /** 元素集合 */
  private _annotationMapping: Map<string, AnnotationLine> = new Map();

  /** 端点对标注id的映射 */
  private _pointAnnotationMapping: Map<string, string> = new Map();

  constructor(data: LineData[], tool: LineTool) {
    super(data, tool);

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

  public override destroy() {
    super.destroy();

    eventEmitter.off(EInternalEvent.Render, this.render.bind(this));

    this._annotationMapping.forEach((element) => {
      element.destroy();
    });

    this._annotationMapping.clear();
  }

  public override render(ctx: CanvasRenderingContext2D) {
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
