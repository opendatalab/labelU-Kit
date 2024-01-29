import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { LineData, PointItem } from '../annotations';
import { AnnotationLine } from '../annotations';
import type { AxisPoint, PointStyle } from '../shapes';
import { Point } from '../shapes';
import { axis, eventEmitter, monitor, rbush } from '../singletons';
import { EInternalEvent } from '../enums';
import { Group } from '../shapes/Group';
import { DraftLine, DraftLineCurve } from '../drafts';
import { Spline } from '../shapes/Spline.shape';
import { ToolWrapper } from './Tool.decorator';

export interface LineToolOptions extends BasicToolParams<LineData, LineStyle> {
  /**
   * 线条类型
   * @description
   * - line: 直线
   * - spline: 曲线
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
   * 最小点数
   * @description 至少两个点
   * @default 2
   */
  minPointAmount?: number;

  /**
   * 最大点数
   * @default undefined
   */
  maxPointAmount?: number;
}

// @ts-ignore
@ToolWrapper
export class LineTool extends Tool<LineData, LineStyle, LineToolOptions> {
  static convertToCanvasCoordinates(data: LineData[]) {
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

  private _holdingSlopes: Point[] | null = null;

  private _holdingSlopeEdge: Line | null = null;

  public sketch: Group<Line | Point | Spline, LineStyle | PointStyle> | null = null;

  public draft: DraftLine | DraftLineCurve | null = null;

  constructor({ style, data, ...params }: LineToolOptions) {
    super({
      name: 'line',
      lineType: 'line',
      edgeAdsorptive: true,
      outOfImage: true,
      minPointAmount: 2,
      labels: [],
      selectedStyle: {},
      // ----------------
      data: LineTool.convertToCanvasCoordinates(data ?? []),
      style: {
        ...Line.DEFAULT_STYLE,
        ...style,
      },
      ...params,
    });

    AnnotationLine.buildLabelMapping(params.labels ?? []);

    this.setupShapes();

    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.on(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }

  protected setupShapes() {
    const { _data = [] } = this;

    for (const annotation of _data) {
      this._addAnnotation(annotation);
    }
  }

  /**
   * 点击画布事件处理
   */
  protected onSelect = (annotation: AnnotationLine) => (_e: MouseEvent) => {
    this.archiveDraft();
    this._createDraft(annotation.data);
    this.onAnnotationSelect(annotation.data);
    Tool.emitSelect(this.convertAnnotationItem(this.draft!.data), this.name);
  };

  private _validate(data: LineData) {
    const { config } = this;

    if (data.points.length < config.minPointAmount!) {
      Tool.error({
        type: 'minPointAmount',
        message: `Line must have at least ${config.minPointAmount} points!`,
        value: config.minPointAmount,
      });

      return false;
    }

    return true;
  }

  private _addAnnotation(data: LineData) {
    const { drawing, style, hoveredStyle } = this;

    const annotation = new AnnotationLine({
      id: data.id,
      data,
      style,
      hoveredStyle,
      showOrder: this.showOrder,
    });

    annotation.group.on(EInternalEvent.Select, this.onSelect(annotation));

    drawing!.set(data.id, annotation);
  }

  private _createDraft(data: LineData) {
    const { style } = this;

    if (data.type === 'line') {
      this.draft = new DraftLine(this.config, {
        id: data.id,
        data,
        style,
        showOrder: this.showOrder,
      });
    } else if (data.type === 'spline') {
      this.draft = new DraftLineCurve(this.config, {
        id: data.id,
        data,
        showOrder: this.showOrder,
        style,
      });
    } else {
      throw new Error('Invalid line type!');
    }

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

  protected rebuildDraft(data?: LineData) {
    if (!this.draft) {
      return;
    }

    const dataClone = cloneDeep(data ?? this.draft.data);

    this.draft.destroy();
    this.draft = null;
    this._createDraft(dataClone);
  }

  protected handleMouseDown = (e: MouseEvent) => {
    // ====================== 绘制 ======================
    const { activeLabel, style, sketch, draft, config } = this;

    const isUnderDraft =
      draft &&
      (draft.isUnderCursor({ x: e.offsetX, y: e.offsetY }) ||
        draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY }));

    if (!activeLabel || isUnderDraft || monitor?.keyboard.Space) {
      return;
    }

    const startPoint = axis!.getOriginalCoord({
      // 超出安全区域的点直接落在安全区域边缘
      x: config.outOfImage ? e.offsetX : axis!.getSafeX(e.offsetX),
      y: config.outOfImage ? e.offsetY : axis!.getSafeY(e.offsetY),
    });

    // 先归档选中的草稿
    this.archiveDraft();

    if (config.lineType === 'spline') {
      if (!this.sketch) {
        this.sketch = new Group(uuid(), monitor!.getNextOrder());
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
      this.sketch.add(
        new Spline({
          id: uuid(),
          style: { ...style, stroke: AnnotationLine.labelStatic.getLabelColor(activeLabel) },
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
      this.sketch.add(slopeEdge);
      this.sketch.add(slopeStartPoint);
      this.sketch.add(slopeEndPoint);
    } else {
      // 绘制直线
      if (!sketch) {
        this.sketch = new Group(uuid(), monitor!.getNextOrder());
      }

      // 创建新的线段
      const lastLine = this.sketch?.last() as Line | null;
      this.sketch?.add(
        new Line({
          id: uuid(),
          style: { ...style, stroke: AnnotationLine.labelStatic.getLabelColor(activeLabel) },
          coordinate: [
            {
              ...(lastLine ? lastLine.coordinate[1] : startPoint),
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
      const nearestPoint = rbush.scanLinesAndSetNearestPoint(
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

      // 创建点不松开鼠标，等效拖拽控制点
      if (_holdingSlopes) {
        // 第一条曲线
        if (sketch.shapes.length === 4) {
          // 更新斜率点的坐标
          _holdingSlopes[0].coordinate[0].x = x;
          _holdingSlopes[0].coordinate[0].y = y;
          _holdingSlopes[1].coordinate[0].x = x;
          _holdingSlopes[1].coordinate[0].y = y;

          _holdingSlopeEdge!.coordinate[1].x = x;
          _holdingSlopeEdge!.coordinate[1].y = y;

          // 更新曲线的控制点
          lastCurve.controlPoints[0].x = x;
          lastCurve.controlPoints[0].y = y;
          lastCurve.controlPoints[1].x = x;
          lastCurve.controlPoints[1].y = y;
          // 更新曲线结束点坐标
          lastCurve.coordinate[1].x = x;
          lastCurve.coordinate[1].y = y;
        } else {
          const preCurve = sketch.shapes[sketch.shapes.length - 8] as Spline;

          _holdingSlopeEdge!.coordinate[1].x = x;
          _holdingSlopeEdge!.coordinate[1].y = y;
          lastCurve.controlPoints[0].x = x;
          lastCurve.controlPoints[0].y = y;

          // 更新曲线结束点坐标
          lastCurve.coordinate[1].x = x;
          lastCurve.coordinate[1].y = y;

          _holdingSlopes[1].coordinate[0].x = x;
          _holdingSlopes[1].coordinate[0].y = y;

          // 对称控制点更新(对称点坐标计算公式：对称点坐标 = 轴点坐标 * 2 - 当前点坐标)
          // 绘制第二条以上的曲线时，需要更新上一条曲线的**结束**控制点，这个点是当前鼠标移动点的对称点
          preCurve.controlPoints[1].x = 2 * lastCurve.coordinate[0].x - x;
          preCurve.controlPoints[1].y = 2 * lastCurve.coordinate[0].y - y;
          _holdingSlopeEdge!.coordinate[0].x = 2 * lastCurve.coordinate[0].x - x;
          _holdingSlopeEdge!.coordinate[0].y = 2 * lastCurve.coordinate[0].y - y;

          _holdingSlopes[0].coordinate[0].x = 2 * lastCurve.coordinate[0].x - x;
          _holdingSlopes[0].coordinate[0].y = 2 * lastCurve.coordinate[0].y - y;
        }
      } else {
        // 更新曲线结束点，结束点需要跟随鼠标
        lastCurve.coordinate[1].x = x;
        lastCurve.coordinate[1].y = y;
        // 结束控制点也设为鼠标当前点
        lastCurve.controlPoints[1].x = x;
        lastCurve.controlPoints[1].y = y;
      }

      sketch.update();
    } else {
      // 正在绘制的线段，最后一个端点的坐标跟随鼠标
      const { shapes } = sketch;
      const lastShape = shapes[shapes.length - 1];

      // 按住shift绘制水平或垂直线
      if (monitor?.keyboard.Shift) {
        // x距离大于y距离，绘制水平线
        if (Math.abs(x - lastShape.plainCoordinate[0].x) > Math.abs(y - lastShape.plainCoordinate[0].y)) {
          lastShape.coordinate[1].x = x;
          lastShape.coordinate[1].y = lastShape.plainCoordinate[0].y;
        } else {
          lastShape.coordinate[1].x = lastShape.plainCoordinate[0].x;
          lastShape.coordinate[1].y = y;
        }
      } else {
        lastShape.coordinate[1].x = x;
        lastShape.coordinate[1].y = y;
      }
      sketch.update();
    }
  };

  private _handleLeftMouseUp = () => {
    this._holdingSlopes = null;
    this._holdingSlopeEdge = null;
  };

  private _handleRightMouseUp = (e: MouseEvent) => {
    // 移动画布时的右键不归档
    if (axis?.isMoved) {
      return;
    }

    this._archiveSketch(e);
  };

  protected handleEscape = () => {
    this.sketch?.destroy();
    this.sketch = null;

    axis?.rerender();
  };

  protected handleDelete = () => {
    const { sketch, draft } = this;

    // 如果正在创建，则取消创建
    if (sketch) {
      sketch?.destroy();
      this.sketch = null;
    } else if (draft) {
      // 如果选中了草稿，则删除草稿
      const data = cloneDeep(draft.data);
      this.deleteDraft();
      this.removeFromDrawing(data.id);
      Tool.onDelete(this.convertAnnotationItem(data));
    }
  };

  protected convertAnnotationItem(data: LineData) {
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

    let data: LineData;
    const points: PointItem[] = [];
    let additionPayload;

    if (config.lineType === 'line') {
      // 最后一个点不需要加入标注
      for (let i = 0; i < sketch.shapes.length - 1; i++) {
        const shape = sketch.shapes[i];

        // 第一条曲线要把开始点也加上
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
      data = {
        id: uuid(),
        type: 'line',
        points: points,
        label: this.activeLabel,
        order: monitor!.getNextOrder(),
      };
      additionPayload = [{ ...data, points: data.points.map((point) => axis!.convertCanvasCoordinate(point)) }];
    } else {
      // 最后一个点不需要加入标注
      // 以四个图形为一组，分别是曲线、连接线，开始控制点、结束控制点，当前的i表示结束控制点
      const controlPoints: AxisPoint[] = [];

      for (let i = 0; i < sketch.shapes.length - 4; i += 4) {
        const curve = sketch.shapes[i] as Spline;

        controlPoints.push(...curve.plainControlPoints);

        if (i === 0) {
          // 第一条曲线取开始点和结束点
          points.push({
            id: uuid(),
            x: curve.coordinate[0].x,
            y: curve.coordinate[0].y,
          });
        }
        points.push({
          id: uuid(),
          x: curve.coordinate[1].x,
          y: curve.coordinate[1].y,
        });
      }
      data = {
        id: uuid(),
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
    }

    if (!this._validate(data)) {
      return;
    }

    this._addAnnotation(data);

    sketch.destroy();
    this.sketch = null;
    axis!.rerender();
    this.onSelect(this.drawing!.get(data.id) as AnnotationLine)(new MouseEvent(''));
    monitor!.setSelectedAnnotationId(data.id);

    Tool.onAdd(additionPayload, e);
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }
}
