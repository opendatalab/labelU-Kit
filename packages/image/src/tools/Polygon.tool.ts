import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import { AnnotationPolygon } from '../annotation';
import type { AxisPoint, LineStyle, PointStyle, PolygonStyle } from '../shapes';
import { BezierCurve, PolygonCurve, Line, Point, Polygon } from '../shapes';
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

  public draft: DraftPolygon | DraftPolygonCurve | null = null;

  private _creatingShapes: Group<Polygon | Line, PolygonStyle | LineStyle> | null = null;

  private _holdingSlopes: Point[] | null = null;

  private _holdingSlopeEdge: Line | null = null;

  public _creatingCurves: Group<PolygonCurve | Line | Point, LineStyle | PointStyle> | null = null;

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

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleLeftMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
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
    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    this._creatingCurves?.destroy();
    this._creatingCurves = null;
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

    this.draft =
      data.type === 'line'
        ? new DraftPolygon(this.config, {
            id: data.id,
            data,
            style: { ...style, stroke: this.getLabelColor(data.label) },
            // 在草稿上添加取消选中的事件监听
            onUnSelect: this.onUnSelect,
            onBBoxOut: this.handlePointStyle,
            onBBoxOver: this.handlePointStyle,
          })
        : new DraftPolygonCurve(this.config, {
            id: data.id,
            data,
            style: { ...style, stroke: this.getLabelColor(data.label) },
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

  private _handleLeftMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================
    const { activeLabel, style, draft, config } = this;

    const isUnderDraft = draft && draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY });

    if (!activeLabel || isUnderDraft) {
      return;
    }

    const startPoint = axis!.getOriginalCoord({
      x: config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX),
      y: config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY),
    });

    // 先归档上一次的草稿
    this._archiveDraft();

    if (config.lineType === 'curve') {
      if (!this._creatingCurves) {
        this._creatingCurves = new Group(uuid(), monitor!.getNextOrder());
        // 背景填充
        this._creatingCurves.add(
          new PolygonCurve({
            id: uuid(),
            style: { ...style, stroke: this.getLabelColor(activeLabel), strokeWidth: 8 },
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
        const currentCreatingPolygonCurve = this._creatingCurves.shapes[0] as PolygonCurve;
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
        new BezierCurve({
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

  private _handleLeftMouseMove = (e: MouseEvent) => {
    const { _creatingShapes, _creatingCurves, _holdingSlopes, _holdingSlopeEdge, config } = this;

    const x = axis!.getOriginalX(config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX));
    const y = axis!.getOriginalY(config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY));

    if (_creatingCurves) {
      const lastCurve = _creatingCurves.shapes[_creatingCurves.shapes.length - 4] as BezierCurve;
      const polygonCurve = _creatingCurves.shapes[0] as PolygonCurve;

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
          const preCurve = _creatingCurves.shapes[_creatingCurves.shapes.length - 8] as BezierCurve;

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

  private _handleRightMouseUp = () => {
    const { _creatingShapes, _creatingCurves } = this;
    // 移动画布时的右键不归档
    if (axis?.isMoved) {
      return;
    }

    // 归档创建中的图形
    if (_creatingCurves) {
      this._archivePolygonCurves();
    } else if (_creatingShapes) {
      this._archivePolygons();
    }
  };

  private _archivePolygonCurves() {
    const { _creatingCurves } = this;

    if (!_creatingCurves) {
      return;
    }

    const points = [];
    const polygonCurve = _creatingCurves.shapes[0] as PolygonCurve;
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
      type: 'curve',
      pointList: points,
      controlPoints,
      label: this.activeLabel,
      order: monitor!.getNextOrder(),
    };

    this._addAnnotation(data);
    _creatingCurves.destroy();
    this._creatingCurves = null;
    axis!.rerender();
    this.onSelect(new MouseEvent(''), this.drawing!.get(data.id) as AnnotationPolygon);
    monitor!.setSelectedAnnotationId(data.id);
  }

  private _archivePolygons() {
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
  }
}
