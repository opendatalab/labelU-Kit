import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { LineData } from '../annotation';
import { AnnotationLine } from '../annotation';
import type { AxisPoint, PointStyle } from '../shapes';
import { Rect, Point } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { EInternalEvent } from '../enums';
import { Group } from '../shapes/Group';

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
        coordinate: cloneDeep([startPoint, endPoint]),
        style,
      });

      group.add(line);
    }

    // 点要覆盖在线上
    for (let i = 0; i < data.pointList.length; i++) {
      const pointItem = data.pointList[i];
      const point = new Point({
        id: pointItem.id,
        // 深拷贝，避免出现引用问题
        coordinate: cloneDeep(pointItem),
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

  /**
   * 选中选框
   */
  private _isSelectionPicked: boolean = false;

  /**
   * 选中端点
   */
  private _selectedPoint: Point | null = null;

  private _previousPointCoordinate: AxisPoint | null = null;

  private _effectedLines: [Line | undefined, Line | undefined] | null = null;

  private _creatingShapes: Group<Line | Point, LineStyle | PointStyle> | null = null;

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

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
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
  protected onSelect = (_e: MouseEvent, annotation: AnnotationLine) => {
    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this._archiveDraft();
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

  private _addAnnotation(data: LineData) {
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

  private _createSelection() {
    if (this._selectionShape) {
      this._selectionShape.destroy();
    }

    const { draft } = this;
    const bbox = draft!.group.bbox;

    this._selectionShape = new Rect({
      id: uuid(),
      coordinate: axis!.getOriginalCoord({
        x: bbox.minX,
        y: bbox.minY,
      }),
      width: (bbox.maxX - bbox.minX) / axis!.scale,
      height: (bbox.maxY - bbox.minY) / axis!.scale,
      style: {
        stroke: '#fff',
        strokeWidth: 1,
      },
    });
  }

  private _handleMouseDown = (e: MouseEvent) => {
    const { draft, _selectionShape, _creatingShapes } = this;

    if (draft && !_creatingShapes) {
      // ====================== 点击点 ======================
      draft.group.each((shape) => {
        if (shape instanceof Point) {
          if (shape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
            this._selectedPoint = shape;
            this._previousPointCoordinate = {
              x: shape.dynamicCoordinate[0].x,
              y: shape.dynamicCoordinate[0].y,
            };

            return false;
          }
        }
      });

      // 选中点后不继续执行
      if (this._selectedPoint) {
        this._effectedLines = [undefined, undefined];

        draft.group.each((shape) => {
          if (shape instanceof Line) {
            if (
              shape.dynamicCoordinate[0].x === this._selectedPoint?.dynamicCoordinate[0].x &&
              shape.dynamicCoordinate[0].y === this._selectedPoint?.dynamicCoordinate[0].y
            ) {
              // 线段的起点
              this._effectedLines![0] = shape;
            }
            if (
              shape.dynamicCoordinate[1].x === this._selectedPoint?.dynamicCoordinate[0].x &&
              shape.dynamicCoordinate[1].y === this._selectedPoint?.dynamicCoordinate[0].y
            ) {
              // 线段的终点
              this._effectedLines![1] = shape;
            }
          }
        });

        return;
      }

      // 选中选框
      if (_selectionShape && _selectionShape.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
        this._isSelectionPicked = true;
        this.previousCoordinates = this.getCoordinates();

        return;
      }
    }

    // ====================== 绘制 ======================
    const { activeLabel, style } = this;

    if (!activeLabel) {
      return;
    }

    // 先归档上一次的草稿
    this._archiveDraft();

    if (!_creatingShapes) {
      this._creatingShapes = new Group(uuid(), monitor!.getMaxOrder() + 1);
    }

    const startPoint = axis!.getOriginalCoord({
      x: e.offsetX - axis!.distance.x,
      y: e.offsetY - axis!.distance.y,
    });

    // 创建新的线段
    this._creatingShapes?.add(
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
    const {
      draft,
      previousCoordinates,
      _isSelectionPicked,
      _selectedPoint,
      _previousPointCoordinate,
      _creatingShapes,
      _effectedLines,
    } = this;

    if (draft && _selectedPoint && _previousPointCoordinate && _effectedLines) {
      this._destroySelection();
      _selectedPoint.coordinate = [
        axis!.getOriginalCoord({
          x: e.offsetX,
          y: e.offsetY,
        }),
      ];

      // 更新受影响的线段端点
      if (_effectedLines[1] === undefined && _effectedLines[0]) {
        _effectedLines[0].coordinate[0] = { ..._selectedPoint.coordinate[0] };
      } else if (_effectedLines[0] === undefined && _effectedLines[1]) {
        _effectedLines[1].coordinate[1] = { ..._selectedPoint.coordinate[0] };
      } else if (_effectedLines[0] && _effectedLines[1]) {
        // 更新下一个线段的起点
        _effectedLines[0].coordinate[0] = { ..._selectedPoint.coordinate[0] };
        // 更新前一个线段的终点
        _effectedLines[1].coordinate[1] = { ..._selectedPoint.coordinate[0] };
      }

      // 手动更新组合内的图形
      draft.group.each((shape) => {
        shape.update();
      });
      // 手动更新组合的包围盒
      draft.group.updateBBox();
      draft.group.updateRBush();

      draft.syncCoordToData();
    } else if (draft && _isSelectionPicked) {
      this._destroySelection();
      // 更新草稿坐标
      draft.group.each((shape, index) => {
        const startPoint = axis!.getOriginalCoord({
          x: previousCoordinates[index][0].x + axis!.distance.x,
          y: previousCoordinates[index][0].y + axis!.distance.y,
        });

        if (shape instanceof Point) {
          shape.coordinate = [startPoint];
        } else {
          const endPoint = axis!.getOriginalCoord({
            x: previousCoordinates[index][1].x + axis!.distance.x,
            y: previousCoordinates[index][1].y + axis!.distance.y,
          });
          shape.coordinate = [startPoint, endPoint];
        }

        // 手动更新图形内部的包围盒
        shape.update();
      });

      // 手动更新组合的包围盒
      draft.group.updateBBox();
      draft.group.updateRBush();

      draft.syncCoordToData();
    } else if (_creatingShapes) {
      // 正在绘制的线段，最后一个端点的坐标跟随鼠标
      const { shapes } = _creatingShapes;
      const lastShape = shapes[shapes.length - 1];
      lastShape.coordinate[1].x = axis!.getOriginalX(e.offsetX);
      lastShape.coordinate[1].y = axis!.getOriginalY(e.offsetY);
      shapes.forEach((shape) => {
        shape.update();
      });
      _creatingShapes.updateBBox();
      _creatingShapes.updateRBush();
    }
  };

  private _handleMouseUp = () => {
    if (this._isSelectionPicked) {
      this.previousCoordinates = this.getCoordinates();
      this._isSelectionPicked = false;
      this._createSelection();
    } else if (this._selectedPoint) {
      this._selectedPoint = null;
      this._previousPointCoordinate = null;
      this._createSelection();
    }
  };

  private _handleRightMouseUp = () => {
    // 归档创建中的图形
    if (this._creatingShapes) {
      const points = [];
      // 最后一个点不需要加入标注
      for (let i = 0; i < this._creatingShapes.shapes.length - 1; i++) {
        const shape = this._creatingShapes.shapes[i];
        if (i === 0) {
          points.push(
            {
              id: shape.id,
              x: axis!.getOriginalX(shape.dynamicCoordinate[0].x),
              y: axis!.getOriginalY(shape.dynamicCoordinate[0].y),
            },
            {
              id: uuid(),
              x: axis!.getOriginalX(shape.dynamicCoordinate[1].x),
              y: axis!.getOriginalY(shape.dynamicCoordinate[1].y),
            },
          );
        } else {
          points.push({
            id: uuid(),
            x: axis!.getOriginalX(shape.dynamicCoordinate[1].x),
            y: axis!.getOriginalY(shape.dynamicCoordinate[1].y),
          });
        }
      }
      const data: LineData = {
        id: uuid(),
        pointList: points,
        label: this.activeLabel,
        order: monitor!.getMaxOrder() + 1,
      };

      this._addAnnotation(data);
      this._creatingShapes.destroy();
      this._creatingShapes = null;
      axis!.rerender();
      this.onSelect(new MouseEvent(''), this.drawing!.get(data.id) as AnnotationLine);
      monitor!.setSelectedAnnotationId(data.id);
    }
  };

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
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }
}
