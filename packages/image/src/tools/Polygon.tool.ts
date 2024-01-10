import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import { AnnotationPolygon } from '../annotations';
import type { AxisPoint, LineStyle, PointStyle, PolygonStyle } from '../shapes';
import { Spline, ClosedSpline, Line, Point, Polygon } from '../shapes';
import { axis, eventEmitter, monitor, rbush } from '../singletons';
import { EInternalEvent } from '../enums';
import { Group } from '../shapes/Group';
import type { PolygonData } from '../annotations/Polygon.annotation';
import { DraftPolygonCurve, DraftPolygon } from '../drafts';
import { ToolWrapper } from './Tool.decorator';

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
   * @description 至少三个点
   * @default 3
   */
  closingPointAmount?: number;
}

// @ts-ignore
@ToolWrapper
export class PolygonTool extends Tool<PolygonData, PolygonStyle, PolygonToolOptions> {
  static convertToCanvasCoordinates(data: PolygonData[]) {
    return data.map((item) => ({
      ...item,
      points: item.points.map((point) => ({
        ...point,
        ...axis!.convertSourceCoordinate(point),
      })),
    }));
  }

  public draft: DraftPolygon | DraftPolygonCurve | null = null;

  private _creatingShapes: Group<Polygon | Line, PolygonStyle | LineStyle> | null = null;

  private _holdingSlopes: Point[] | null = null;

  private _holdingSlopeEdge: Line | null = null;

  private _creatingCurves: Group<ClosedSpline | Line | Point, LineStyle | PointStyle> | null = null;

  constructor(params: PolygonToolOptions) {
    super({
      name: 'polygon',
      lineType: 'line',
      edgeAdsorptive: true,
      outOfImage: true,
      closingPointAmount: 3,
      labels: [],
      // ----------------
      data: [],
      ...params,
      style: {
        ...Polygon.DEFAULT_STYLE,
        ...params.style,
      },
    });

    AnnotationPolygon.buildLabelMapping(params.labels ?? []);
    this.setupShapes();

    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.on(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }

  /**
   * 点击画布事件处理
   */
  protected onSelect = (_e: MouseEvent, annotation: AnnotationPolygon) => {
    Tool.emitSelect(this.convertAnnotationItem(annotation.data));

    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    this.activate(annotation.data.label);
    eventEmitter.emit(EInternalEvent.ToolChange, this.name, annotation.data.label);
    this.archiveDraft();
    this._createDraft(annotation.data);
    // 2. 销毁成品
    this.removeFromDrawing(annotation.id);

    // 重新渲染
    axis!.rerender();
  };

  protected onUnSelect = (_e: MouseEvent) => {
    if (this.draft) {
      Tool.emitUnSelect(this.convertAnnotationItem(this.draft.data));
    }

    this.archiveDraft();
    this?._creatingShapes?.destroy();
    this._creatingShapes = null;
    this._creatingCurves?.destroy();
    this._creatingCurves = null;
    // 重新渲染
    axis!.rerender();
  };

  protected setupShapes() {
    const { _data = [] } = this;

    for (const annotation of _data) {
      this._addAnnotation(annotation);
    }
  }

  private _addAnnotation(data: PolygonData) {
    const { drawing, style, hoveredStyle } = this;

    drawing!.set(
      data.id,
      new AnnotationPolygon({
        id: data.id,
        data,
        showOrder: this.showOrder,
        style,
        hoveredStyle,
        onSelect: this.onSelect,
      }),
    );
  }

  private _validate(data: PolygonData) {
    const { config } = this;

    if (data.points.length < config.closingPointAmount!) {
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
        ? new DraftPolygon(
            this.config,
            {
              id: data.id,
              data,
              showOrder: false,
              style: this.style,
              // 在草稿上添加取消选中的事件监听
              onUnSelect: this.onUnSelect,
            },
            this,
          )
        : new DraftPolygonCurve(this.config, {
            id: data.id,
            data,
            showOrder: false,
            style: this.style,
            // 在草稿上添加取消选中的事件监听
            onUnSelect: this.onUnSelect,
          });
  }

  protected archiveDraft() {
    const { draft } = this;

    if (draft) {
      this._addAnnotation(draft.data);
      this.recoverData();
      draft.destroy();
      this.draft = null;
    }
  }

  protected rebuildDraft(data?: PolygonData) {
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

  protected handleEscape = () => {
    this._archiveCreatingShapes(
      new MouseEvent('escape', {
        bubbles: true,
        cancelable: true,
        clientX: axis?.cursor?.coordinate.x,
        clientY: axis?.cursor?.coordinate.y,
      }) as MouseEvent,
    );
  };

  protected handleDelete = () => {
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
      Tool.onDelete(this.convertAnnotationItem(data));
    }
  };

  protected handleMouseDown = (e: MouseEvent) => {
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
    this.archiveDraft();

    if (config.lineType === 'spline') {
      if (!this._creatingCurves) {
        this._creatingCurves = new Group(uuid(), monitor!.getNextOrder());
        // 背景填充
        this._creatingCurves.add(
          new ClosedSpline({
            id: uuid(),
            style: {
              ...style,
              fill: Color(AnnotationPolygon.labelStatic.getLabelColor(activeLabel)).alpha(0.3).toString(),
            },
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
          style: { ...style, stroke: AnnotationPolygon.labelStatic.getLabelColor(activeLabel) },
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
          style: {
            ...style,
            stroke: AnnotationPolygon.labelStatic.getLabelColor(activeLabel),
            fill: Color(AnnotationPolygon.labelStatic.getLabelColor(activeLabel)).alpha(0.3).toString(),
          },
          coordinate: [
            {
              ...(rbush.nearestPoint?.coordinate[0] ?? startPoint),
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
        style: { ...style, stroke: AnnotationPolygon.labelStatic.getLabelColor(activeLabel) },
        coordinate: [
          {
            ...(rbush.nearestPoint?.coordinate[0] ?? startPoint),
          },
          {
            ...startPoint,
          },
        ],
      }),
    );
  };

  protected handleMouseMove = (e: MouseEvent) => {
    const { _creatingShapes, _creatingCurves, _holdingSlopes, _holdingSlopeEdge, config, activeLabel } = this;

    let x = axis!.getOriginalX(config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX));
    let y = axis!.getOriginalY(config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY));

    // 激活状态才能吸附
    if (activeLabel && config.lineType === 'line' && config.edgeAdsorptive) {
      const nearestPoint = rbush.scanPolygonsAndSetNearestPoint(
        { x: e.offsetX, y: e.offsetY },
        10,
        _creatingShapes ? [_creatingShapes.id] : [],
      );

      if (nearestPoint) {
        x = nearestPoint.x;
        y = nearestPoint.y;
      }
    }

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

  protected convertAnnotationItem(data: PolygonData) {
    const _temp = {
      ...data,
      points: data.points.map((point) => {
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
      points: points,
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
        points: data.points.map((point) => axis!.convertCanvasCoordinate(point)),
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
      points: points,
      label: this.activeLabel,
      order: monitor!.getNextOrder(),
    };

    if (!this._validate(data)) {
      return;
    }

    Tool.onAdd(
      {
        ...data,
        points: data.points.map((point) => axis!.convertCanvasCoordinate(point)),
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

  public createAnnotationsFromData(datas: PolygonData[]) {
    const { drawing, style, hoveredStyle } = this;

    if (!datas) {
      return;
    }

    datas.forEach((data) => {
      drawing!.set(
        data.id,
        new AnnotationPolygon({
          id: data.id,
          data,
          showOrder: this.showOrder,
          style,
          hoveredStyle,
          onSelect: this.onSelect,
        }),
      );
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

    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }
}
