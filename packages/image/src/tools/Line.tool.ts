import { v4 as uuid } from 'uuid';

import type { LineStyle } from '../shape/Line.shape';
import { Line } from '../shape/Line.shape';
import { ETool } from '../enums';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { LineData } from '../annotation';
import { AnnotationLine } from '../annotation';
import { Rect } from '../shape';
import { axis } from '../singletons';

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

export class LineTool extends Tool<LineData, LineStyle, LineToolOptions> {
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

    this._init();
  }

  private _init() {
    const { data = [] } = this;

    for (const annotation of data) {
      this.addAnnotation(annotation);
    }
  }

  public addAnnotation(data: LineData) {
    const { style, hoveredStyle, drawing } = this;

    drawing!.set(
      data.id,
      new AnnotationLine({
        id: data.id,
        data,
        style: { ...style, stroke: this.getLabelColor(data.label) },
        hoveredStyle,
        onSelect: this.onSelect,
      }),
    );
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
  public onSelect = (_e: MouseEvent, annotation: AnnotationLine) => {
    const { style } = this;
    const { data } = annotation;

    // 1. 创建草稿
    this.draft = new AnnotationLine({
      id: data.id,
      data,
      style: { ...style, stroke: this.getLabelColor(data.label) },
      // 在草稿上添加取消选中的事件监听
      onUnSelect: this.onUnSelect,
    });

    // 2. 销毁成品
    this.removeFromDrawing(data.id);

    // 3. 记录选中前的坐标
    this.previousCoordinates = this.getCoordinates();

    // 4. 选中标注，创建选框，进入编辑模式
    // 如果存在上一次的选框，需要销毁
    if (this._selectionShape) {
      this._destroySelection();
    }
    // 创建选框图形
    this._createSelection();
    // 重新渲染
    axis!.rerender();
  };

  public onUnSelect = (_e: MouseEvent, annotation: AnnotationLine) => {
    this.addAnnotation(annotation.data);
    this._destroySelection();
    this.draft?.destroy();
    // 重新渲染
    axis!.rerender();
  };

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

    const { draft } = this;
    const bbox = draft!.bbox;

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
