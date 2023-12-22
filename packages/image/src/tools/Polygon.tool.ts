import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import { AnnotationPolygon } from '../annotation';
import type { AxisPoint, LineStyle, PointStyle, PolygonStyle } from '../shapes';
import { Spline, ClosedSpline, Line, Point, Polygon } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import { EInternalEvent } from '../enums';
import { Group } from '../shapes/Group';
import type { PolygonData } from '../annotation/Polygon.annotation';
import { DraftPolygonCurve, DraftPolygon } from '../drafts';

export interface PolygonToolOptions extends BasicToolParams<PolygonData, PolygonStyle> {
  /**
   * 线条类型
   * @description
   * - line: 直线
   * - curve: 曲线
   * @default 'line'
   */
  lineType?: 'line' | 'spline';

  /**
   * 边缘吸附
   * @default true;
   */
  edgeAdsorptive?: boolean;

  /**
   * 图片外标注
   * @default true;
   */
  outOfImage?: boolean;

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

  public draft: DraftPolygon | DraftPolygonCurve | null = null;

  private _creatingShapes: Group<Polygon | Line, PolygonStyle | LineStyle> | null = null;

  private _holdingSlopes: Point[] | null = null;

  private _holdingSlopeEdge: Line | null = null;

  public _creatingCurves: Group<ClosedSpline | Line | Point, LineStyle | PointStyle> | null = null;

  constructor(params: PolygonToolOptions) {
    super({
      name: 'polygon',
      lineType: 'line',
      edgeAdsorptive: true,
      outOfImage: true,
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

    this._setupShapes();

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleLeftMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.on(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
    eventEmitter.on(EInternalEvent.Escape, this._handleEscape);
    eventEmitter.on(EInternalEvent.Delete, this._handleDelete);
    eventEmitter.on(EInternalEvent.BackSpace, this._handleDelete);
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
    Tool.emitSelect(this._convertAnnotationItem(annotation.data));

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
    if (this.draft) {
      Tool.emitUnSelect(this._convertAnnotationItem(this.draft.data));
    }

    this._archiveDraft();
    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    this._creatingCurves?.destroy();
    this._creatingCurves = null;
    // 重新渲染
    axis!.rerender();
  };

  private _setupShapes() {
    const { _data = [] } = this;

    for (const annotation of _data) {
      this._addAnnotation(annotation);
    }
  }

  private _addAnnotation(data: PolygonData) {
    const { drawing } = this;

    drawing!.set(
      data.id,
      new AnnotationPolygon({
        id: data.id,
        data,
        showOrder: this.showOrder,
        label: this.getLabelText(data.label),
        style: this._makeStaticStyle(data.label),
        hoveredStyle: this._makeHoveredStyle(data.label),
        onSelect: this.onSelect,
      }),
    );
  }

  private _makeStaticStyle(label?: string) {
    const { style } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    const labelColor = this.getLabelColor(label);

    return { ...style, stroke: labelColor, fill: Color(labelColor).alpha(0.3).toString() };
  }

  private _makeHoveredStyle(label?: string) {
    const { style, hoveredStyle } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    if (hoveredStyle && Object.keys(hoveredStyle).length > 0) {
      return hoveredStyle;
    }

    const labelColor = this.getLabelColor(label);

    return {
      ...style,
      stroke: labelColor,
      strokeWidth: style.strokeWidth! + 2,
      fill: Color(labelColor).alpha(0.6).toString(),
    };
  }

  private _makeSelectedStyle(label?: string) {
    const { style, selectedStyle } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    if (selectedStyle && Object.keys(selectedStyle).length > 0) {
      return selectedStyle;
    }

    const labelColor = this.getLabelColor(label);

    return {
      ...style,
      stroke: labelColor,
      fill: Color(labelColor).alpha(0.6).toString(),
    };
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

  private _validate(data: PolygonData) {
    const { config } = this;

    if (data.pointList.length < config.closingPointAmount!) {
      Tool.error({
        type: 'closingPointAmount',
        message: `Polygon must have at least ${config.closingPointAmount} points!`,
      });

      return false;
    }

    return true;
  }

  private _createDraft(data: PolygonData) {
    this.draft =
      data.type === 'line'
        ? new DraftPolygon(this.config, {
            id: data.id,
            data,
            showOrder: false,
            label: '',
            style: this._makeSelectedStyle(data.label),
            // 在草稿上添加取消选中的事件监听
            onUnSelect: this.onUnSelect,
            onBBoxOut: this.handlePointStyle,
            onBBoxOver: this.handlePointStyle,
          })
        : new DraftPolygonCurve(this.config, {
            id: data.id,
            data,
            showOrder: false,
            label: '',
            style: this._makeSelectedStyle(data.label),
            // 在草稿上添加取消选中的事件监听
            onUnSelect: this.onUnSelect,
            onBBoxOut: this.handlePointStyle,
            onBBoxOver: this.handlePointStyle,
          });
  }

  private _archiveDraft() {
    const { draft } = this;

    if (draft) {
      this._addAnnotation(draft.data);
      draft.destroy();
      this.draft = null;
    }
  }

  private _rebuildDraft(data?: PolygonData) {
    if (!this.draft) {
      return;
    }

    const dataClone = cloneDeep(data ?? this.draft.data);

    this.draft.destroy();
    this.draft = null;
    this._createDraft(dataClone);
  }

  private _archiveCreatingShapes(e: MouseEvent) {
    const { _creatingShapes, _creatingCurves } = this;

    // 归档创建中的图形
    if (_creatingCurves) {
      this._archivePolygonCurves(e);
    } else if (_creatingShapes) {
      this._archivePolygons(e);
    }
  }

  private _handleEscape = () => {
    this._archiveCreatingShapes(
      new MouseEvent('escape', {
        bubbles: true,
        cancelable: true,
        clientX: axis?.cursor?.coordinate.x,
        clientY: axis?.cursor?.coordinate.y,
      }) as MouseEvent,
    );
  };

  private _handleDelete = () => {
    const { _creatingShapes, _creatingCurves, draft } = this;

    // 如果正在创建，则取消创建
    if (_creatingShapes || _creatingCurves) {
      _creatingShapes?.destroy();
      _creatingCurves?.destroy();
      this._creatingShapes = null;
      this._creatingCurves = null;
      axis?.rerender();
    } else if (draft) {
      // 如果选中了草稿，则删除草稿
      const data = cloneDeep(draft.data);
      this.deleteDraft();
      axis?.rerender();
      Tool.onDelete(this._convertAnnotationItem(data));
    }
  };

  private _handleLeftMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================
    const { activeLabel, style, draft, config } = this;

    const isUnderDraft = draft && draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY });

    if (!activeLabel || isUnderDraft || monitor?.keyboard.Space) {
      return;
    }

    const startPoint = axis!.getOriginalCoord({
      x: config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX),
      y: config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY),
    });

    // 先归档上一次的草稿
    this._archiveDraft();

    if (config.lineType === 'spline') {
      if (!this._creatingCurves) {
        this._creatingCurves = new Group(uuid(), monitor!.getNextOrder());
        // 背景填充
        this._creatingCurves.add(
          new ClosedSpline({
            id: uuid(),
            style: this._makeStaticStyle(activeLabel),
            coordinate: [
              {
                ...startPoint,
              },
              {
                ...startPoint,
              },
            ],
            controlPoints: [
              {
                ...startPoint,
              },
              {
                ...startPoint,
              },
              {
                ...startPoint,
              },
              {
                ...startPoint,
              },
            ],
          }),
        );
      } else {
        // 往曲线中增加一个点
        const currentCreatingPolygonCurve = this._creatingCurves.shapes[0] as ClosedSpline;
        currentCreatingPolygonCurve.coordinate = [
          ...currentCreatingPolygonCurve.plainCoordinate,
          cloneDeep(startPoint),
        ];
        // 往曲线中新增的点增加两个控制点
        currentCreatingPolygonCurve.controlPoints = [
          ...currentCreatingPolygonCurve.plainControlPoints.slice(
            0,
            currentCreatingPolygonCurve.plainControlPoints.length - 1,
          ),
          cloneDeep(startPoint),
          cloneDeep(startPoint),
          cloneDeep(
            currentCreatingPolygonCurve.plainControlPoints[currentCreatingPolygonCurve.plainControlPoints.length - 1],
          ),
        ];
      }

      // 按下鼠标左键的时候默认是拖拽第一个控制点
      const slopeStartPoint = new Point({
        id: uuid(),
        style: { ...style, fill: '#fff', radius: 4, strokeWidth: 0, opacity: 0.5 },
        coordinate: { ...startPoint },
      });
      const slopeEndPoint = new Point({
        id: uuid(),
        style: { ...style, fill: '#fff', radius: 4, strokeWidth: 0, opacity: 0.5 },
        coordinate: { ...startPoint },
      });
      this._holdingSlopes = [slopeStartPoint, slopeEndPoint];
      this._creatingCurves.add(
        new Spline({
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
          controlPoints: [
            {
              ...startPoint,
            },
            {
              ...startPoint,
            },
          ],
        }),
      );
      const slopeEdge = new Line({
        id: uuid(),
        style: { ...style, stroke: '#fff', strokeWidth: 1, opacity: 0.5 },
        coordinate: [
          {
            ...startPoint,
          },
          {
            ...startPoint,
          },
        ],
      });
      this._holdingSlopeEdge = slopeEdge;
      this._creatingCurves.add(slopeEdge);
      this._creatingCurves.add(slopeStartPoint);
      this._creatingCurves.add(slopeEndPoint);

      return;
    }

    if (!this._creatingShapes) {
      this._creatingShapes = new Group(uuid(), monitor!.getNextOrder());
      this._creatingShapes?.add(
        new Polygon({
          id: uuid(),
          style: this._makeStaticStyle(activeLabel),
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

  private _handleLeftMouseMove = (e: MouseEvent) => {
    const { _creatingShapes, _creatingCurves, _holdingSlopes, _holdingSlopeEdge, config } = this;

    const x = axis!.getOriginalX(config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX));
    const y = axis!.getOriginalY(config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY));

    if (_creatingCurves) {
      const lastCurve = _creatingCurves.shapes[_creatingCurves.shapes.length - 4] as Spline;
      const polygonCurve = _creatingCurves.shapes[0] as ClosedSpline;

      // 创建点不松开鼠标，等效拖拽控制点
      if (_holdingSlopes) {
        // 第一条曲线
        if (_creatingCurves.shapes.length === 5) {
          // 更新斜率点的坐标
          _holdingSlopes[0].coordinate[0].x = x;
          _holdingSlopes[0].coordinate[0].y = y;
          _holdingSlopes[1].coordinate[0].x = x;
          _holdingSlopes[1].coordinate[0].y = y;

          // 更新控制杆坐标
          _holdingSlopeEdge!.coordinate[1].x = x;
          _holdingSlopeEdge!.coordinate[1].y = y;

          // 更新曲线结束点坐标
          lastCurve.coordinate[1].x = x;
          lastCurve.coordinate[1].y = y;
          // 更新多边形曲线的最后一个点
          polygonCurve.coordinate[polygonCurve.coordinate.length - 1].x = x;
          polygonCurve.coordinate[polygonCurve.coordinate.length - 1].y = y;

          // 更新曲线的控制点
          lastCurve.controlPoints[0].x = x;
          lastCurve.controlPoints[0].y = y;
          lastCurve.controlPoints[1].x = x;
          lastCurve.controlPoints[1].y = y;

          // 更新多边形曲线的控制点
          polygonCurve.updateControlPointByPointIndex(polygonCurve.coordinate.length - 2, 'start', {
            x,
            y,
          });
          polygonCurve.updateControlPointByPointIndex(polygonCurve.coordinate.length - 2, 'end', {
            x: 2 * lastCurve.coordinate[0].x - x,
            y: 2 * lastCurve.coordinate[0].y - y,
          });
          _holdingSlopeEdge!.coordinate[0].x = 2 * lastCurve.coordinate[0].x - x;
          _holdingSlopeEdge!.coordinate[0].y = 2 * lastCurve.coordinate[0].y - y;

          _holdingSlopes[0].coordinate[0].x = 2 * lastCurve.coordinate[0].x - x;
          _holdingSlopes[0].coordinate[0].y = 2 * lastCurve.coordinate[0].y - y;
        } else {
          const preCurve = _creatingCurves.shapes[_creatingCurves.shapes.length - 8] as Spline;

          _holdingSlopeEdge!.coordinate[1].x = x;
          _holdingSlopeEdge!.coordinate[1].y = y;
          _holdingSlopes[1].coordinate[0].x = x;
          _holdingSlopes[1].coordinate[0].y = y;

          // 更新曲线结束点坐标
          lastCurve.coordinate[1].x = x;
          lastCurve.coordinate[1].y = y;
          // 更新多边形曲线的最后一个点
          polygonCurve.coordinate[polygonCurve.coordinate.length - 1].x = x;
          polygonCurve.coordinate[polygonCurve.coordinate.length - 1].y = y;

          lastCurve.controlPoints[0].x = x;
          lastCurve.controlPoints[0].y = y;
          // 更新多边形曲线的控制点
          polygonCurve.updateControlPointByPointIndex(polygonCurve.coordinate.length - 2, 'start', {
            x,
            y,
          });
          polygonCurve.updateControlPointByPointIndex(polygonCurve.coordinate.length - 1, 'start', {
            x,
            y,
          });
          polygonCurve.updateControlPointByPointIndex(polygonCurve.coordinate.length - 1, 'end', {
            x,
            y,
          });

          // 对称控制点更新(对称点坐标计算公式：对称点坐标 = 轴点坐标 * 2 - 当前点坐标)
          // 绘制第二条以上的曲线时，需要更新上一条曲线的**结束**控制点，这个点是当前鼠标移动点的对称点
          preCurve.controlPoints[1].x = 2 * lastCurve.coordinate[0].x - x;
          preCurve.controlPoints[1].y = 2 * lastCurve.coordinate[0].y - y;
          polygonCurve.updateControlPointByPointIndex(polygonCurve.coordinate.length - 2, 'end', {
            x: 2 * lastCurve.coordinate[0].x - x,
            y: 2 * lastCurve.coordinate[0].y - y,
          });
          _holdingSlopeEdge!.coordinate[0].x = 2 * lastCurve.coordinate[0].x - x;
          _holdingSlopeEdge!.coordinate[0].y = 2 * lastCurve.coordinate[0].y - y;

          _holdingSlopes[0].coordinate[0].x = 2 * lastCurve.coordinate[0].x - x;
          _holdingSlopes[0].coordinate[0].y = 2 * lastCurve.coordinate[0].y - y;
        }
      } else {
        // 更新曲线结束点，结束点需要跟随鼠标
        lastCurve.coordinate[1].x = x;
        lastCurve.coordinate[1].y = y;
        // 更新多边形曲线的最后一个点
        polygonCurve.coordinate[polygonCurve.coordinate.length - 1].x = x;
        polygonCurve.coordinate[polygonCurve.coordinate.length - 1].y = y;
        // 结束控制点也设为鼠标当前点
        lastCurve.controlPoints[1].x = x;
        lastCurve.controlPoints[1].y = y;
        // 更新多边形曲线的控制点
        // 注意：当前点是鼠标移动中的点，所以倒数第二个才是已经确定的最后一个坐标点
        polygonCurve.updateControlPointByPointIndex(polygonCurve.coordinate.length - 1, 'start', {
          x,
          y,
        });
        polygonCurve.updateControlPointByPointIndex(polygonCurve.coordinate.length - 1, 'end', {
          x,
          y,
        });
      }

      _creatingCurves.update();
    } else if (_creatingShapes) {
      // 正在绘制的线段，最后一个端点的坐标跟随鼠标
      const { shapes } = _creatingShapes;
      const lastShape = shapes[shapes.length - 1];
      lastShape.coordinate[1].x = x;
      lastShape.coordinate[1].y = y;
      // 更新多边形的最后一个点
      _creatingShapes.shapes[0].coordinate[_creatingShapes.shapes[0].coordinate.length - 1] = cloneDeep(
        lastShape.coordinate[1],
      );
      _creatingShapes.update();
    }
  };

  private _handleLeftMouseUp = () => {
    this._holdingSlopes = null;
    this._holdingSlopeEdge = null;
  };

  private _handleRightMouseUp = (e: MouseEvent) => {
    const { _creatingShapes, _creatingCurves } = this;
    // 移动画布时的右键不归档
    if (axis?.isMoved) {
      return;
    }

    // 归档创建中的图形
    if (_creatingCurves) {
      this._archivePolygonCurves(e);
    } else if (_creatingShapes) {
      this._archivePolygons(e);
    }
  };

  private _convertAnnotationItem(data: PolygonData) {
    const _temp = {
      ...data,
      pointList: data.pointList.map((point) => {
        return {
          ...point,
          ...axis!.convertCanvasCoordinate(point),
        };
      }),
    };

    if (_temp.type === 'spline') {
      _temp.controlPoints = data.controlPoints!.map((point) => {
        return {
          ...point,
          ...axis!.convertCanvasCoordinate(point),
        };
      });
    }

    return _temp;
  }

  private _archivePolygonCurves(e: MouseEvent) {
    const { _creatingCurves } = this;

    if (!_creatingCurves) {
      return;
    }

    const points = [];
    const polygonCurve = _creatingCurves.shapes[0] as ClosedSpline;
    const controlPoints: AxisPoint[] = [
      ...polygonCurve.plainControlPoints.slice(0, polygonCurve.plainControlPoints.length - 3),
      polygonCurve.plainControlPoints[polygonCurve.plainControlPoints.length - 1],
    ];

    // 最后一个点不加入标注
    for (let i = 0; i < polygonCurve.coordinate.length - 1; i++) {
      const shape = polygonCurve;
      const point = shape.coordinate[i];
      points.push({
        id: uuid(),
        ...point,
      });
    }

    const data: PolygonData = {
      id: uuid(),
      type: 'spline',
      pointList: points,
      controlPoints,
      label: this.activeLabel,
      order: monitor!.getNextOrder(),
    };

    if (!this._validate(data)) {
      return;
    }

    Tool.onAdd(
      {
        ...data,
        pointList: data.pointList.map((point) => axis!.convertCanvasCoordinate(point)),
        controlPoints: data.controlPoints!.map((point) => axis!.convertCanvasCoordinate(point)),
      },
      e,
    );

    this._addAnnotation(data);
    _creatingCurves.destroy();
    this._creatingCurves = null;
    axis!.rerender();
    this.onSelect(new MouseEvent(''), this.drawing!.get(data.id) as AnnotationPolygon);
    monitor!.setSelectedAnnotationId(data.id);
  }

  private _archivePolygons(e: MouseEvent) {
    const { _creatingShapes } = this;

    if (!_creatingShapes) {
      return;
    }

    // 最后一个点不加入标注
    const points = [];

    for (let i = 0; i < _creatingShapes.shapes[0].coordinate.length - 1; i++) {
      const shape = _creatingShapes.shapes[0];
      const point = shape.coordinate[i];
      points.push({
        id: uuid(),
        ...point,
      });
    }

    const data: PolygonData = {
      id: uuid(),
      type: 'line',
      pointList: points,
      label: this.activeLabel,
      order: monitor!.getNextOrder(),
    };

    if (!this._validate(data)) {
      return;
    }

    Tool.onAdd(
      {
        ...data,
        pointList: data.pointList.map((point) => axis!.convertCanvasCoordinate(point)),
      },
      e,
    );

    this._addAnnotation(data);
    _creatingShapes.destroy();
    this._creatingShapes = null;
    axis!.rerender();
    this.onSelect(new MouseEvent(''), this.drawing!.get(data.id) as AnnotationPolygon);
    monitor!.setSelectedAnnotationId(data.id);
  }

  public getPolygonCoordinates() {
    const { draft } = this;

    if (!draft) {
      return [];
    }

    return cloneDeep(draft.group.shapes[0].dynamicCoordinate);
  }

  public deactivate(): void {
    super.deactivate();
    this._archiveDraft();
    axis!.rerender();
  }

  public toggleOrderVisible(visible: boolean): void {
    this.showOrder = visible;

    this.clearDrawing();
    this._setupShapes();
  }

  public setLabel(value: string): void {
    const { draft, activeLabel } = this;

    if (!draft || !activeLabel || activeLabel === value) {
      return;
    }

    this.activate(value);

    const data = cloneDeep(draft.data);

    this._rebuildDraft({
      ...data,
      label: value,
    });
  }

  public get data() {
    const result = super.data;

    return result.map((item) => {
      return this._convertAnnotationItem(item);
    });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    if (this._creatingCurves) {
      this._creatingCurves.render(ctx);
    }

    if (this._creatingShapes) {
      this._creatingShapes.render(ctx);
    }
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleLeftMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
    eventEmitter.off(EInternalEvent.Escape, this._handleEscape);
    eventEmitter.off(EInternalEvent.Delete, this._handleDelete);
    eventEmitter.off(EInternalEvent.BackSpace, this._handleDelete);
  }
}
