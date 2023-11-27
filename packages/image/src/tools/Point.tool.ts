import type { ILabel } from '@labelu/interface';
// import { v4 as uuid } from 'uuid';

import { ETool } from '../enums';
import type { PointStyle } from '../shape/Point.shape';
import { Point } from '../shape/Point.shape';
import type { IAnnotationTool } from './Tool';
import { Tool } from './Tool';
import type { AnnotationPoint, PointData } from '../annotation/Point.annotation';
import { PointPen } from '../pen';
import type { PointToolOptions } from '../drawing/Point.drawing';
import { PointDrawing } from '../drawing/Point.drawing';
import { Selection } from '../decorators/Selection.decorator';
import { Group } from '../shape/Group';
import { axis } from '../singletons';

@Selection
export class PointTool
  extends Tool<PointData, PointStyle, PointToolOptions, AnnotationPoint>
  implements IAnnotationTool<PointData, PointStyle, PointToolOptions, AnnotationPoint>
{
  public toolName = ETool.Point;

  public group: Group<Point, PointStyle> | null = null;

  private _selectionShape: Point | null = null;

  constructor(params: PointToolOptions) {
    super({
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
   * 点击标注时：
   * 1. 销毁被点击的标注的drawing（成品）
   * 2. 进入pen的编辑模式
   *  2.1. 创建新的drawing（成品），需要包含点、线
   *  2.2. 创建选中包围盒
   */
  public onSelect = (annotation: AnnotationPoint) => {
    this.activatedAnnotation = annotation;
    this.group = new Group(annotation.id);
    annotation.group.updateStyle({
      fill: '#fff',
    });
    axis!.rerender();
  };

  public onUnSelect = () => {
    this.activatedAnnotation = null;
    axis!.rerender();
  };

  public createDrawing(data?: PointData[]) {
    if (data) {
      this.data = data;
    }

    const { data: _data } = this;

    if (!Array.isArray(_data)) {
      throw Error('Data must be an array!');
    }

    this.drawing = new PointDrawing(_data, this);
  }

  public switchToPen(label: string | ILabel) {
    this.pen = new PointPen(this, label);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    if (this._selectionShape) {
      this._selectionShape.render(ctx);
    }
  }
}
