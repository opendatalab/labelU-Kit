import { v4 as uuid } from 'uuid';

import type { LineStyle } from '../shape/Line.shape';
import { Line } from '../shape/Line.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { LineData } from '../annotation';
import { AnnotationLine } from '../annotation';
import type { PointStyle } from '../shape';
import { Rect, Point } from '../shape';
import { axis, eventEmitter } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { EInternalEvent } from '../enums';

class DraftLine extends Annotation<LineData, Line | Point, LineStyle | PointStyle> {
  constructor(params: AnnotationParams<LineData, LineStyle>) {
    super(params);

    this._setupShapes();
  }

  private _setupShapes() {
    const { data, group, style } = this;

    for (let i = 1; i < data.pointList.length; i++) {
      const startPoint = data.pointList[i - 1];
      const endPoint = data.pointList[i];

      const line = new Line({
        id: uuid(),
        coordinate: [startPoint, endPoint],
        style,
      });

      group.add(line);
    }

    // 点要覆盖在线上
    for (let i = 0; i < data.pointList.length; i++) {
      const pointItem = data.pointList[i];
      const point = new Point({
        id: pointItem.id,
        coordinate: pointItem,
        style: { ...style, radius: 8, stroke: 'transparent', fill: 'blue' },
        groupIgnoreRadius: true,
      });

      group.add(point);
    }
  }

  public syncCoordToData() {
    const { group, data } = this;
    const pointSize = data.pointList.length;

    for (let i = pointSize - 1; i < group.shapes.length; i++) {
      data.pointList[i - pointSize + 1].x = axis!.getOriginalX(group.shapes[i].dynamicCoordinate[0].x);
      data.pointList[i - pointSize + 1].y = axis!.getOriginalY(group.shapes[i].dynamicCoordinate[0].y);
    }
  }
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

// @MouseDecorator
export class LineTool extends Tool<LineData, LineStyle, LineToolOptions> {
  private _selectionShape: Rect | null = null;
  constructor(params: LineToolOptions) {
    super({
      name: 'line',
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

    eventEmitter.on(EInternalEvent.LeftMouseDownWithoutTarget, this._handleMouseDown);
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
    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this._archive();
    this._createDraft(annotation.data);
    // 2. 销毁成品
    this.removeFromDrawing(annotation.id);

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

  public onUnSelect = (_e: MouseEvent) => {
    this._archive();
    this._destroySelection();
    // 重新渲染
    axis!.rerender();
  };

  protected onPick = (_e: MouseEvent) => {
    this.previousCoordinates = this.getCoordinates();
    this._destroySelection();
    // 重新渲染
    axis!.rerender();
  };

  protected handlePointStyle = () => {
    const { draft } = this;

    if (!draft) {
      return;
    }

    draft.group.each((shape) => {
      if (shape instanceof Point) {
        shape.updateStyle({
          stroke: 'transparent',
        });
      }
    });
  };

  protected onMove = (_e: MouseEvent) => {
    const { draft, previousCoordinates } = this;

    if (!draft) {
      return;
    }

    // 更新草稿坐标
    draft.group.each((shape, index) => {
      if (shape instanceof Point) {
        shape.dynamicCoordinate[0].x = previousCoordinates[index][0].x + axis!.distance.x;
        shape.dynamicCoordinate[0].y = previousCoordinates[index][0].y + axis!.distance.y;
      } else {
        shape.dynamicCoordinate[0].x = previousCoordinates[index][0].x + axis!.distance.x;
        shape.dynamicCoordinate[0].y = previousCoordinates[index][0].y + axis!.distance.y;
        shape.dynamicCoordinate[1].x = previousCoordinates[index][1].x + axis!.distance.x;
        shape.dynamicCoordinate[1].y = previousCoordinates[index][1].y + axis!.distance.y;
      }

      // 手动更新图形内部的包围盒
      shape.updateBBox();
      shape.updateRBush();
    });

    draft.syncCoordToData();

    if (this._selectionShape) {
      this._selectionShape.dynamicCoordinate[0].x = draft.bbox.minX + axis!.distance.x;
      this._selectionShape.dynamicCoordinate[0].y = draft.bbox.minY + axis!.distance.y;
    }
  };

  protected onMoveEnd = () => {
    this.previousCoordinates = this.getCoordinates();
    this._createSelection();
  };

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    if (this._selectionShape) {
      this._selectionShape.render(ctx);
    }
  }

  private _createDraft(data: LineData) {
    const { style } = this;

    this.draft = new DraftLine({
      id: data.id,
      data,
      style: { ...style, stroke: this.getLabelColor(data.label) },
      // 在草稿上添加取消选中的事件监听
      onUnSelect: this.onUnSelect,
      onBBoxOut: this.handlePointStyle,
      onBBoxOver: this.handlePointStyle,
      onPick: this.onPick,
      onMove: this.onMove,
      onMoveEnd: this.onMoveEnd,
    });
  }

  private _archive() {
    const { draft } = this;

    if (draft) {
      this.addAnnotation(draft.data);
      draft.destroy();
      this._destroySelection();
      this.draft = null;
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
      // TODO: 选中框样式开放配置
      {
        stroke: 'red',
        strokeWidth: 5,
      },
    );
  }

  private _handleMouseDown = () => {
    this._archive();
  };

  private _destroySelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
      this._selectionShape = null;
    }
  }
}
