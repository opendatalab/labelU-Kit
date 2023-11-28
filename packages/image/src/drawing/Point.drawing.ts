import type { ILabel } from '@labelu/interface';

import { EInternalEvent } from '../enums';
import type { BasicToolParams } from '../tools/Tool';
import { Drawing } from './Drawing';
import type { PointStyle } from '../shape/Point.shape';
import { eventEmitter } from '../singletons';
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

export class PointDrawing extends Drawing<PointData, PointStyle> {
  constructor(labels: ILabel[], data: PointData[], style: PointStyle, hoveredStyle: PointStyle) {
    super(data, labels, style, hoveredStyle, {});

    this._init();
  }

  private _init() {
    this._buildMappings();

    eventEmitter.on(EInternalEvent.Render, this.render);
  }

  private _buildMappings() {
    const { data = [] } = this;

    for (const annotation of data) {
      this.addAnnotation(annotation);
    }
  }

  public addAnnotation(data: PointData) {
    const { style, hoveredStyle } = this;

    console.log(data.label, this.getLabelColor(data.label), { ...style, fill: this.getLabelColor(data.label) });

    this.annotationMapping.set(
      data.id,
      new AnnotationPoint(data.id, data, { ...style, fill: this.getLabelColor(data.label) }, hoveredStyle),
    );
  }

  public destroy() {
    super.destroy();

    eventEmitter.off(EInternalEvent.Render, this.render);
  }

  public render = (ctx: CanvasRenderingContext2D) => {
    const { annotationMapping } = this;

    annotationMapping.forEach((element) => {
      element.render(ctx);
    });
  };
}
