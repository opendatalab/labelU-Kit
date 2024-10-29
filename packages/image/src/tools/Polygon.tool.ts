import cloneDeep from 'lodash.clonedeep';
import Color from 'color';

import uid from '@/utils/uid';

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
   * 最少闭合点个数
   * @description 至少三个点
   * @default 3
   */
  minPointAmount?: number;

  /**
   * 最多闭合点个数
   * @description 无限制
   * @default undefined
   */
  maxPointAmount?: number;
}

// @ts-ignore
@ToolWrapper
export class PolygonTool extends Tool<PolygonData, PolygonStyle, PolygonToolOptions> {
  static convertToCanvasCoordinates(data: PolygonData[]) {
    let _data = data.map((item) => ({
      ...item,
      points: item.points.map((point) => ({
        ...point,
        ...axis!.convertSourceCoordinate(point),
      })),
    }));

    if (data?.[0]?.type === 'spline') {
      _data = _data.map((item) => ({
        ...item,
        controlPoints: item.controlPoints!.map((point) => ({
          ...point,
          ...axis!.convertSourceCoordinate(point),
        })),
      }));
    }

    return _data;
  }

  static create({ data, ...config }: PolygonToolOptions) {
    return new PolygonTool({ ...config, data: PolygonTool.convertToCanvasCoordinates(data ?? []) });
  }

  private _holdingSlopes: Point[] | null = null;

  private _holdingSlopeEdge: Line | null = null;

  public draft: DraftPolygon | DraftPolygonCurve | null = null;

  public sketch: Group<Polygon | ClosedSpline | Line | Point, PolygonStyle | LineStyle | PointStyle> | null = null;

  constructor(params: PolygonToolOptions) {
    super({
      name: 'polygon',
      lineType: 'line',
      edgeAdsorptive: true,
      outOfImage: true,
      minPointAmount: 3,
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

  public load(data: PolygonData[]) {
    this._data.push(...PolygonTool.convertToCanvasCoordinates(data));
    this.clearDrawing();
    this.setupShapes();
  }

  /**
   * 点击画布事件处理
   */
  protected onSelect = (annotation: AnnotationPolygon) => (_e: MouseEvent) => {
    this.archiveDraft();
    this._createDraft(annotation.data);
    this.onAnnotationSelect(annotation.data);
    monitor!.setSelectedAnnotationId(annotation.id);
    Tool.emitSelect(this.convertAnnotationItem(this.draft!.data), this.name, _e);
  };

  protected setupShapes() {
    const { _data = [] } = this;

    for (const annotation of _data) {
      this._addAnnotation(annotation);
    }
  }

  private _addAnnotation(data: PolygonData) {
    const { drawing, style, hoveredStyle } = this;

    const annotation = new AnnotationPolygon({
      id: data.id,
      data,
      showOrder: this.showOrder,
      style,
      hoveredStyle,
    });

    annotation.group.on(EInternalEvent.Select, this.onSelect(annotation));

    drawing!.set(data.id, annotation);
  }

  private _validate(points: AxisPoint[]) {
    const { config } = this;

    if (points.length < config.minPointAmount!) {
      Tool.error({
        type: 'minPointAmount',
        message: `Polygon must have at least ${config.minPointAmount} points!`,
        value: config.minPointAmount,
      });

      return false;
    }

    if (config.maxPointAmount && points.length > config.maxPointAmount) {
      Tool.error({
        type: 'maxPointAmount',
        message: `Polygon must have at most ${config.maxPointAmount} points!`,
        value: config.maxPointAmount,
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
            },
            this,
          )
        : new DraftPolygonCurve(this.config, {
            id: data.id,
            data,
            showOrder: false,
            style: this.style,
          });

    this.draft.group.on(EInternalEvent.UnSelect, () => {
      this.archiveDraft();
      axis?.rerender();
    });
  }

  protected archiveDraft() {
    const { draft } = this;

    if (draft) {
      Tool.emitUnSelect(this.convertAnnotationItem(draft.data));
      this._addAnnotation(draft.data);
      this.recoverData();
      draft.destroy();
      this.draft = null;
    }
  }

  protected destroySketch() {
    const { sketch } = this;

    if (sketch) {
      sketch.destroy();
      this.sketch = null;
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

  protected updateSketchStyleByLabel(label: string) {
    const { sketch } = this;

    if (!sketch) {
      return;
    }

    const polygon = sketch.shapes[0] as Polygon;

    polygon.updateStyle({
      ...polygon.style,
      fill: Color(AnnotationPolygon.labelStatic.getLabelColor(label)).alpha(0.3).toString(),
    });

    sketch.each((shape, index) => {
      if (index > 0) {
        shape.updateStyle({
          ...shape.style,
          stroke: AnnotationPolygon.labelStatic.getLabelColor(label),
        });
      }
    });
  }

  protected handleEscape = () => {
    this.destroySketch();
    axis?.rerender();
  };

  protected handleDelete = () => {
    const { sketch, draft } = this;

    // 如果正在创建，则取消创建
    if (sketch) {
      this.destroySketch();
    } else if (draft) {
      // 如果选中了草稿，则删除草稿
      const data = cloneDeep(draft.data);
      this.deleteDraft();
      this.removeFromDrawing(data.id);
      Tool.onDelete(this.convertAnnotationItem(data));
    }
  };

  protected handleMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================
    const { activeLabel, style, draft, config } = this;

    const isUnderDraft = draft && draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY });

    if (isUnderDraft) {
      return;
    }

    const startPoint = axis!.getOriginalCoord({
      x: config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX),
      y: config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY),
    });

    // 先归档上一次的草稿
    this.archiveDraft();

    if (config.lineType === 'spline') {
      if (!this.sketch) {
        this.sketch = new Group(uid(), monitor!.getNextOrder());
        // 背景填充
        this.sketch.add(
          new ClosedSpline({
            id: uid(),
            style: {
              ...style,
              stroke: 'transparent',
              strokeWidth: 0,
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
        if (this.sketch.shapes[0].coordinate.length + 1 > config.maxPointAmount!) {
          Tool.error({
            type: 'maxPointAmount',
            message: `Polygon must have at most ${config.maxPointAmount} points!`,
            value: config.maxPointAmount,
          });
          return;
        }
        // 往曲线中增加一个点
        const currentCreatingPolygonCurve = this.sketch.shapes[0] as ClosedSpline;
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
        id: uid(),
        style: { ...style, fill: '#fff', radius: 4, strokeWidth: 0, opacity: 0.5 },
        coordinate: { ...startPoint },
      });
      const slopeEndPoint = new Point({
        id: uid(),
        style: { ...style, fill: '#fff', radius: 4, strokeWidth: 0, opacity: 0.5 },
        coordinate: { ...startPoint },
      });
      this._holdingSlopes = [slopeStartPoint, slopeEndPoint];
      this.sketch.add(
        new Spline({
          id: uid(),
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
        id: uid(),
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
      this.sketch.add(slopeEdge);
      this.sketch.add(slopeStartPoint);
      this.sketch.add(slopeEndPoint);
    } else {
      if (!this.sketch) {
        this.sketch = new Group(uid(), monitor!.getNextOrder());
        this.sketch?.add(
          new Polygon({
            id: uid(),
            style: {
              ...style,
              // 填充的多边形不需要边框
              strokeWidth: 0,
              stroke: 'transparent',
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
      if (this.sketch.shapes[0].coordinate.length + 1 > config.maxPointAmount!) {
        Tool.error({
          type: 'maxPointAmount',
          message: `Polygon must have at most ${config.maxPointAmount} points!`,
          value: config.maxPointAmount,
        });
        return;
      }

      this.sketch.shapes[0].coordinate = [...this.sketch.shapes[0].plainCoordinate, cloneDeep(startPoint)];

      // 创建新的线段
      this.sketch.add(
        new Line({
          id: uid(),
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
    }
  };

  protected handleMouseMove = (e: MouseEvent) => {
    const { sketch, _holdingSlopes, _holdingSlopeEdge, config, activeLabel } = this;

    if (!sketch) {
      return;
    }

    let x = axis!.getOriginalX(config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX));
    let y = axis!.getOriginalY(config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY));

    // 激活状态才能吸附
    if (activeLabel && config.lineType === 'line' && config.edgeAdsorptive) {
      const nearestPoint = rbush.scanPolygonsAndSetNearestPoint(
        { x: e.offsetX, y: e.offsetY },
        10,
        sketch ? [sketch.id] : [],
      );

      if (nearestPoint) {
        x = nearestPoint.x;
        y = nearestPoint.y;
      }
    }

    if (config.lineType === 'spline') {
      const lastCurve = sketch.shapes[sketch.shapes.length - 4] as Spline;
      const polygonCurve = sketch.shapes[0] as ClosedSpline;

      // 创建点不松开鼠标，等效拖拽控制点
      if (_holdingSlopes) {
        // 第一条曲线
        if (sketch.shapes.length === 5) {
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
          const preCurve = sketch.shapes[sketch.shapes.length - 8] as Spline;

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

      sketch.update();
    } else {
      // 正在绘制的线段，最后一个端点的坐标跟随鼠标
      const { shapes } = sketch;
      const lastShape = shapes[shapes.length - 1];
      lastShape.coordinate[1].x = x;
      lastShape.coordinate[1].y = y;
      // 更新多边形的最后一个点
      sketch.shapes[0].coordinate[sketch.shapes[0].coordinate.length - 1] = cloneDeep(lastShape.coordinate[1]);
      sketch.update();
    }
  };

  private _handleLeftMouseUp = () => {
    this._holdingSlopes = null;
    this._holdingSlopeEdge = null;
  };

  private _handleRightMouseUp = (e: MouseEvent) => {
    const { sketch } = this;
    // 移动画布时的右键不归档
    if (axis?.isMoved) {
      return;
    }

    // 归档创建中的图形
    if (sketch) {
      this._archiveSketch(e);
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

  private _archiveSketch(e: MouseEvent) {
    const { sketch, config } = this;

    if (!sketch) {
      return;
    }

    const points = [];
    let data: PolygonData;
    let additionPayload;

    if (config.lineType === 'spline') {
      const polygonCurve = sketch.shapes[0] as ClosedSpline;
      const controlPoints: AxisPoint[] = [
        ...polygonCurve.plainControlPoints.slice(0, polygonCurve.plainControlPoints.length - 3),
        polygonCurve.plainControlPoints[polygonCurve.plainControlPoints.length - 1],
      ];

      // 最后一个点不加入标注
      for (let i = 0; i < polygonCurve.coordinate.length - 1; i++) {
        const shape = polygonCurve;
        const point = shape.coordinate[i];
        points.push({
          id: uid(),
          ...point,
        });
      }

      data = {
        id: uid(),
        type: 'spline',
        points: points,
        controlPoints,
        label: this.activeLabel,
        order: monitor!.getNextOrder(),
      };

      additionPayload = [
        {
          ...data,
          points: data.points.map((point) => axis!.convertCanvasCoordinate(point)),
          controlPoints: data.controlPoints!.map((point) => axis!.convertCanvasCoordinate(point)),
        },
      ];
    } else {
      for (let i = 0; i < sketch.shapes[0].coordinate.length - 1; i++) {
        const shape = sketch.shapes[0];
        const point = shape.coordinate[i];
        points.push({
          id: uid(),
          ...point,
        });
      }

      data = {
        id: uid(),
        type: 'line',
        points: points,
        label: this.activeLabel,
        order: monitor!.getNextOrder(),
      };

      additionPayload = [
        {
          ...data,
          points: data.points.map((point) => axis!.convertCanvasCoordinate(point)),
        },
      ];
    }

    if (!this._validate(data.points)) {
      return;
    }

    this._addAnnotation(data);
    this.destroySketch();
    axis!.rerender();
    this.onSelect(this.drawing!.get(data.id) as AnnotationPolygon)(new MouseEvent(''));
    Tool.onAdd(additionPayload, e);
  }

  public createAnnotationsFromData(datas: PolygonData[]) {
    const { drawing, style, hoveredStyle } = this;

    if (!datas) {
      return;
    }

    datas.forEach((data) => {
      const annotation = new AnnotationPolygon({
        id: data.id,
        data,
        showOrder: this.showOrder,
        style,
        hoveredStyle,
      });

      annotation.group.on(EInternalEvent.Select, this.onSelect(annotation));

      drawing!.set(data.id, annotation);
    });
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }
}
