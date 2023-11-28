import { v4 as uuid } from 'uuid';

import type { LineStyle } from '../shape/Line.shape';
import { Line } from '../shape/Line.shape';
import { ETool } from '../enums';
import { Tool } from './Tool';
import { LinePen } from '../pen';
import type { LineToolOptions } from '../drawing/Line.drawing';
import { LineDrawing } from '../drawing/Line.drawing';
import type { AnnotationLine, LineData } from '../annotation';
import { axis } from '../singletons';
import { Rect } from '../shape';
import { Selection } from '../decorators/Selection.decorator';

@Selection
export class LineTool extends Tool<LineData, LineStyle, LineToolOptions, AnnotationLine> {
  public toolName = ETool.Line;

  private _selectionShape: Rect | null = null;

  constructor(params: LineToolOptions) {
    super({
      lineType: 'line',
      edgeAdsorptive: true,
      outOfCanvas: true,
      closingPointAmount: 2,
      labels: [],
      hoveredStyle: {},
      selectedStyle: {},
      // ----------------
      data: [],
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
    const { style, hoveredStyle, selectedStyle, config } = this;

    this.activatedAnnotation = annotation;

    // 如果存在上一次的选框，需要销毁
    if (this._selectionShape) {
      this._destroySelection();
    }

    // 重新创建选框图形
    this._createSelection();

    // 如果没有画笔，需要创建
    if (!this.pen) {
      this.pen = new LinePen(config.labels, style, hoveredStyle, selectedStyle);
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

    this._destroySelection();
    this.activatedAnnotation = null;
    axis!.rerender();
  };

  public createDrawing(data?: LineData[]) {
    const { style, hoveredStyle, data: _data, config } = this;

    if (data) {
      this.data = data;
    }

    if (!Array.isArray(_data)) {
      throw Error('Data must be an array!');
    }

    this.drawing = new LineDrawing(config.labels || [], _data, style, hoveredStyle);
  }

  public switchToPen(label: string) {
    const { style, hoveredStyle, selectedStyle, config } = this;

    return (this.pen = new LinePen(
      config.labels,
      { ...style, stroke: this.getLabelColor(label) },
      hoveredStyle,
      selectedStyle,
    ));
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
