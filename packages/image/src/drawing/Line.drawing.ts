import type { ILabel } from '@labelu/interface';

import { EInternalEvent } from '../enums';
import type { BasicToolParams } from '../tools/Tool';
import type { LineStyle } from '../shape/Line.shape';
import type { LineData } from '../annotation';
import { AnnotationLine } from '../annotation';
import { eventEmitter } from '../singletons';
import { Drawing } from './Drawing';

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

export class LineDrawing extends Drawing<LineData, LineStyle> {
  constructor(labels: ILabel[], data: LineData[], style: LineStyle, hoveredStyle: LineStyle) {
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

  public addAnnotation(data: LineData) {
    const { style, hoveredStyle } = this;

    this.annotationMapping.set(
      data.id,
      new AnnotationLine(data.id, data, { ...style, stroke: this.getLabelColor(data.label) }, hoveredStyle),
    );
  }

  public override destroy() {
    super.destroy();

    eventEmitter.off(EInternalEvent.Render, this.render);
  }

  public override render = (ctx: CanvasRenderingContext2D) => {
    const { annotationMapping } = this;

    annotationMapping.forEach((element) => {
      element.render(ctx);
    });
  };
}
