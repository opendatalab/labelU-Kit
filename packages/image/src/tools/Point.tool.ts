import { ETool } from '../enums';
import type { PointStyle } from '../shape/Point.shape';
import { Point } from '../shape/Point.shape';
import { Tool } from './Tool';
import type { AnnotationPoint, PointData } from '../annotation/Point.annotation';
import { PointPen } from '../pen';
import type { PointToolOptions } from '../drawing/Point.drawing';
import { PointDrawing } from '../drawing/Point.drawing';
import { Selection } from '../decorators/Selection.decorator';
import { axis } from '../singletons';

@Selection
export class PointTool extends Tool<PointData, PointStyle, PointToolOptions, AnnotationPoint> {
  public toolName = ETool.Point;

  constructor(params: PointToolOptions) {
    super({
      labels: [],
      hoveredStyle: {},
      selectedStyle: {},
      maxPointAmount: Infinity,
      minPointAmount: 0,
      outOfCanvas: true,
      edgeAdsorptive: true,
      data: [],
      // ----------------
      ...params,
      style: {
        ...Point.DEFAULT_STYLE,
        ...params.style,
      },
    });

    this.createDrawing();
  }

  /**
   * 点击画布事件处理
   *
   * @description
   */
  public onSelect = (annotation: AnnotationPoint) => {
    const { style, hoveredStyle, selectedStyle, config } = this;

    this.activatedAnnotation = annotation;

    // 如果没有画笔，需要创建
    if (!this.pen) {
      this.pen = new PointPen(config.labels, style, hoveredStyle, selectedStyle);
    }

    // 画笔需要选中标注
    this.pen.select(annotation);
    // 成品上需要删除选中的标注，进入绘制模式
    this.drawing!.remove(annotation);
    // 重新渲染
    axis!.rerender();
  };

  public onUnSelect = () => {
    const { activatedAnnotation, pen } = this;

    if (pen && activatedAnnotation && pen.draft) {
      this.drawing?.addAnnotation(pen.draft.data);
      pen.unselect();
    }

    this.activatedAnnotation = null;
    axis!.rerender();
  };

  public createDrawing(data?: PointData[]) {
    const { style, hoveredStyle, data: _data, config } = this;

    if (data) {
      this.data = data;
    }

    if (!Array.isArray(_data)) {
      throw Error('Data must be an array!');
    }

    this.drawing = new PointDrawing(config.labels || [], _data, style, hoveredStyle);
  }

  public switchToPen(label: string) {
    const { style, hoveredStyle, selectedStyle, config } = this;

    this.pen = new PointPen(config.labels, style, hoveredStyle, selectedStyle);

    this.pen.label = label;

    return this.pen;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);
  }
}
