import type { ILabel } from '@labelu/interface';
import { v4 as uuid } from 'uuid';

import type { LineStyle } from '../shape/Line.shape';
import { Line } from '../shape/Line.shape';
import { ETool } from '../enums';
import type { IAnnotationTool } from './Tool';
import { Tool } from './Tool';
import { LinePen } from '../pen';
import type { LineToolOptions } from '../drawing/Line.drawing';
import { LineDrawing } from '../drawing/Line.drawing';
import type { AnnotationLine, LineData } from '../annotation';
import { axis } from '../singletons';
import type { Point, PointStyle } from '../shape';
import { Rect } from '../shape';
import { Group } from '../shape/Group';
import { Selection } from '../decorators/Selection.decorator';

@Selection
export class LineTool
  extends Tool<LineData, LineStyle, LineToolOptions, AnnotationLine>
  implements IAnnotationTool<LineData, LineStyle, LineToolOptions, AnnotationLine>
{
  public toolName = ETool.Line;

  public group: Group<Line | Point, LineStyle | PointStyle> | null = null;

  private _selectionShape: Rect | null = null;

  constructor(params: LineToolOptions) {
    super({
      ...params,
      style: {
        ...Line.DEFAULT_STYLE,
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
  public onSelect = (annotation: AnnotationLine) => {
    this.activatedAnnotation = annotation;
    this.group = new Group(annotation.id);
    this._createSelection();
    axis!.rerender();
  };

  public onUnSelect = () => {
    this._destroySelection();
    this.activatedAnnotation = null;
    axis!.rerender();
  };

  public createDrawing(data?: LineData[]) {
    if (data) {
      this.data = data;
    }

    const { data: _data } = this;

    if (!Array.isArray(_data)) {
      throw Error('Data must be an array!');
    }

    this.drawing = new LineDrawing(_data, this);
  }

  public switchToPen(label: string | ILabel) {
    this.pen = new LinePen(this, label);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    if (this._selectionShape) {
      this._selectionShape.render(ctx);
    }
  }

  private _createSelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
    }

    const { activatedAnnotation } = this;
    const bbox = activatedAnnotation!.bbox;

    this._selectionShape = new Rect(
      uuid(),
      axis!.getOriginalCoord({
        x: bbox.minX,
        y: bbox.minY,
      }),
      (bbox.maxX - bbox.minX) / axis!.scale,
      (bbox.maxY - bbox.minY) / axis!.scale,
      {
        stroke: '#fff',
        strokeWidth: 5,
      },
    );
  }

  private _destroySelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
      this._selectionShape = null;
    }
  }
}
