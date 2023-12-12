import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import { AnnotationPolygon } from '../annotation';
import type { LineStyle, PolygonStyle, Rect } from '../shapes';
import { Line, Point, Polygon } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import { EInternalEvent } from '../enums';
import { Group } from '../shapes/Group';
import type { PolygonData } from '../annotation/Polygon.annotation';
import { DraftPolygon } from '../drafts/Polygon.draft';

export interface PolygonToolOptions extends BasicToolParams<PolygonData, PolygonStyle> {
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
export class PolygonTool extends Tool<PolygonData, PolygonStyle, PolygonToolOptions> {
  static convertToCanvasCoordinates(data: PolygonData[]) {
    return data.map((item) => ({
      ...item,
      pointList: item.pointList.map((point) => ({
        ...point,
        ...axis!.convertSourceCoordinate(point),
      })),
    }));
  }

  private _selectionShape: Rect | null = null;

  public draft: DraftPolygon | null = null;

  private _creatingShapes: Group<Polygon | Line, PolygonStyle | LineStyle> | null = null;

  constructor(params: PolygonToolOptions) {
    super({
      name: 'polygon',
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
        ...Polygon.DEFAULT_STYLE,
        ...params.style,
      },
    });

    this._init();

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
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
  protected onSelect = (_e: MouseEvent, annotation: AnnotationPolygon) => {
    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this._archiveDraft();
    this._createDraft(annotation.data);
    // 2. 销毁成品
    this.removeFromDrawing(annotation.id);

    // 重新渲染
    axis!.rerender();
  };

  protected onUnSelect = (_e: MouseEvent) => {
    this._archiveDraft();
    this._destroySelection();
    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    // 重新渲染
    axis!.rerender();
  };

  private _init() {
    const { data = [] } = this;

    for (const annotation of data) {
      this._addAnnotation(annotation);
    }
  }

  private _addAnnotation(data: PolygonData) {
    const { style, hoveredStyle, drawing } = this;

    drawing!.set(
      data.id,
      new AnnotationPolygon({
        id: data.id,
        data,
        style: { ...style, stroke: this.getLabelColor(data.label) },
        hoveredStyle,
        onSelect: this.onSelect,
      }),
    );
  }

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

  private _createDraft(data: PolygonData) {
    const { style } = this;

    this.draft = new DraftPolygon(this.config, {
      id: data.id,
      data,
      style: { ...style, stroke: this.getLabelColor(data.label) },
      // 在草稿上添加取消选中的事件监听
      onUnSelect: this.onUnSelect,
      onBBoxOut: this.handlePointStyle,
      onBBoxOver: this.handlePointStyle,
    });
  }

  private _destroySelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
      this._selectionShape = null;
    }
  }

  private _archiveDraft() {
    const { draft } = this;

    if (draft) {
      this._addAnnotation(draft.data);
      draft.destroy();
      this._destroySelection();
      this.draft = null;
    }
  }

  private _handleMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================
    const { activeLabel, style, draft, config } = this;

    const isUnderDraft = draft && draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY });

    if (!activeLabel || isUnderDraft) {
      return;
    }

    // 先归档上一次的草稿
    this._archiveDraft();

    const startPoint = axis!.getOriginalCoord({
      x: config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX),
      y: config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY),
    });

    if (!this._creatingShapes) {
      this._creatingShapes = new Group(uuid(), monitor!.getMaxOrder() + 1);
      this._creatingShapes?.add(
        new Polygon({
          id: uuid(),
          style: { ...style, stroke: 'transparent', fill: '#f60', strokeWidth: 0 },
          coordinate: [
            {
              ...startPoint,
            },
          ],
        }),
      );
    }

    // 多边形增加一个点
    const { _creatingShapes } = this;

    _creatingShapes.shapes[0].coordinate = [..._creatingShapes.shapes[0].plainCoordinate, cloneDeep(startPoint)];

    // 创建新的线段
    _creatingShapes?.add(
      new Line({
        id: uuid(),
        style: { ...style, stroke: this.getLabelColor(activeLabel) },
        coordinate: [
          {
            ...startPoint,
          },
          {
            ...startPoint,
          },
        ],
      }),
    );
  };

  private _handleMouseMove = (e: MouseEvent) => {
    const { _creatingShapes, config } = this;

    if (_creatingShapes) {
      // 正在绘制的线段，最后一个端点的坐标跟随鼠标
      const { shapes } = _creatingShapes;
      const lastShape = shapes[shapes.length - 1];
      lastShape.coordinate[1].x = axis!.getOriginalX(config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX));
      lastShape.coordinate[1].y = axis!.getOriginalY(config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY));
      // 更新多边形的最后一个点
      _creatingShapes.shapes[0].coordinate[_creatingShapes.shapes[0].coordinate.length - 1] = cloneDeep(
        lastShape.coordinate[1],
      );
      _creatingShapes.update();
    }
  };

  private _handleRightMouseUp = () => {
    // 移动画布时的右键不归档
    if (axis?.isMoved) {
      return;
    }

    // 归档创建中的图形
    if (this._creatingShapes) {
      // 最后一个点不加入标注
      const points = [];

      for (let i = 0; i < this._creatingShapes.shapes[0].coordinate.length - 1; i++) {
        const shape = this._creatingShapes.shapes[0];
        const point = shape.coordinate[i];
        points.push({
          id: uuid(),
          ...point,
        });
      }

      const data: PolygonData = {
        id: uuid(),
        pointList: points,
        label: this.activeLabel,
        order: monitor!.getMaxOrder() + 1,
      };

      this._addAnnotation(data);
      this._creatingShapes.destroy();
      this._creatingShapes = null;
      axis!.rerender();
      this.onSelect(new MouseEvent(''), this.drawing!.get(data.id) as AnnotationPolygon);
      monitor!.setSelectedAnnotationId(data.id);
    }
  };

  public getPolygonCoordinates() {
    const { draft } = this;

    if (!draft) {
      return [];
    }

    return cloneDeep(draft.group.shapes[0].dynamicCoordinate);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    if (this._selectionShape) {
      this._selectionShape.render(ctx);
    }

    if (this._creatingShapes) {
      this._creatingShapes.render(ctx);
    }
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }
}
