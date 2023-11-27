import { EInternalEvent } from '../enums';
import type { BasicToolParams } from '../tools/Tool';
import type { IDrawing } from './Drawing';
import { Drawing } from './Drawing';
import type { PointStyle } from '../shape/Point.shape';
import { eventEmitter } from '../singletons';
import type { PointTool } from '../tools/Point.tool';
import type { PointData } from '../annotation/Point.annotation';
import { AnnotationPoint } from '../annotation/Point.annotation';

/**
 * 点标注工具配置
 */
export interface PointToolOptions extends BasicToolParams<PointData, PointStyle> {
  /**
   * 上限点数
   *
   * @default undefined 默认无限制
   */
  maxPointAmount?: number;

  /**
   * 下限点数
   *
   * @default 0
   */
  minPointAmount?: number;

  /**
   * 画布外标注
   * @default true;
   */
  outOfCanvas?: boolean;

  /**
   * 边缘吸附
   * @default true;
   */
  edgeAdsorptive?: boolean;
}

export class PointDrawing extends Drawing<PointData, PointTool> implements IDrawing<PointData, PointTool> {
  /** 元素集合 */
  private _annotationMapping: Map<string, AnnotationPoint> = new Map();

  constructor(data: PointData[], tool: PointTool) {
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
      _annotationMapping.set(annotation.id, new AnnotationPoint(annotation.id, annotation, tool));
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
}
