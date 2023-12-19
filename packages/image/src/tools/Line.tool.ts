import { v4 as uuid } from 'uuid';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { LineData, PointItem } from '../annotation';
import { AnnotationLine } from '../annotation';
import type { AxisPoint, PointStyle } from '../shapes';
import { Point } from '../shapes';
import { axis, eventEmitter, monitor } from '../singletons';
import { EInternalEvent } from '../enums';
import { Group } from '../shapes/Group';
import { DraftLine, DraftLineCurve } from '../drafts';
import { BezierCurve } from '../shapes/BezierCurve.shape';

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
  static convertToCanvasCoordinates(data: LineData[]) {
    return data.map((item) => ({
      ...item,
      pointList: item.pointList.map((point) => ({
        ...point,
        ...axis!.convertSourceCoordinate(point),
      })),
    }));
  }

  private _creatingLines: Group<Line | Point, LineStyle | PointStyle> | null = null;

  private _creatingCurves: Group<BezierCurve | Line | Point, LineStyle | PointStyle> | null = null;

  private _holdingSlopes: Point[] | null = null;

  private _holdingSlopeEdge: Line | null = null;

  public draft: DraftLine | DraftLineCurve | null = null;

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

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
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
  protected onSelect = (_e: MouseEvent, annotation: AnnotationLine) => {
    this?._creatingLines?.destroy();
    this._creatingLines = null;
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
    const { drawing } = this;

    drawing!.set(
      data.id,
      new AnnotationLine({
        id: data.id,
        data,
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

    return { ...style, stroke: this.getLabelColor(label) };
  }

  private _makeHoveredStyle(label?: string) {
    const { style, hoveredStyle } = this;

    if (typeof label !== 'string') {
      throw new Error('Invalid label! Must be string!');
    }

    if (hoveredStyle && Object.keys(hoveredStyle).length > 0) {
      return hoveredStyle;
    }

    return { ...style, stroke: this.getLabelColor(label), strokeWidth: style.strokeWidth! + 2 };
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

    this.draft =
      data.type === 'line'
        ? new DraftLine(this.config, {
            id: data.id,
            data,
            style: { ...style, stroke: this.getLabelColor(data.label) },
            // 在草稿上添加取消选中的事件监听
            onUnSelect: this.onUnSelect,
            label: '',
            onBBoxOut: this.handlePointStyle,
            onBBoxOver: this.handlePointStyle,
          })
        : new DraftLineCurve(this.config, {
            id: data.id,
            data,
            label: '',
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
    const { activeLabel, style, _creatingLines, draft, config } = this;

    const isUnderDraft =
      draft &&
      (draft.isUnderCursor({ x: e.offsetX, y: e.offsetY }) ||
        draft.group.isShapesUnderCursor({ x: e.offsetX, y: e.offsetY }));

    if (!activeLabel || isUnderDraft) {
      return;
    }

    const startPoint = axis!.getOriginalCoord({
      // 超出安全区域的点直接落在安全区域边缘
      x: config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX),
      y: config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY),
    });

    // 先归档选中的草稿
    this._archiveDraft();

    if (config.lineType === 'curve') {
      if (!this._creatingCurves) {
        this._creatingCurves = new Group(uuid(), monitor!.getNextOrder());
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

    // 绘制直线
    if (!_creatingLines) {
      this._creatingLines = new Group(uuid(), monitor!.getNextOrder());
    }

    // 创建新的线段
    this._creatingLines?.add(
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
    const { _creatingLines, _creatingCurves, _holdingSlopes, _holdingSlopeEdge, config } = this;

    const x = axis!.getOriginalX(config.outOfCanvas ? e.offsetX : axis!.getSafeX(e.offsetX));
    const y = axis!.getOriginalY(config.outOfCanvas ? e.offsetY : axis!.getSafeY(e.offsetY));

    if (_creatingCurves) {
      const lastCurve = _creatingCurves.shapes[_creatingCurves.shapes.length - 4] as BezierCurve;

      // 创建点不松开鼠标，等效拖拽控制点
      if (_holdingSlopes) {
        // 第一条曲线
        if (_creatingCurves.shapes.length === 4) {
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
          const preCurve = _creatingCurves.shapes[_creatingCurves.shapes.length - 8] as BezierCurve;

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

      _creatingCurves.update();
    } else if (_creatingLines) {
      // 正在绘制的线段，最后一个端点的坐标跟随鼠标
      const { shapes } = _creatingLines;
      const lastShape = shapes[shapes.length - 1];
      lastShape.coordinate[1].x = x;
      lastShape.coordinate[1].y = y;
      _creatingLines.update();
    }
  };

  private _handleLeftMouseUp = () => {
    this._holdingSlopes = null;
    this._holdingSlopeEdge = null;
  };

  private _handleRightMouseUp = () => {
    // 移动画布时的右键不归档
    if (axis?.isMoved) {
      return;
    }

    const { _creatingLines, _creatingCurves } = this;

    // 归档创建中的图形
    if (_creatingLines) {
      this._archiveLines();
    } else if (_creatingCurves) {
      this._archiveCurves();
    }
  };

  private _archiveLines() {
    const { _creatingLines } = this;

    if (!_creatingLines) {
      return;
    }

    const points = [];
    // 最后一个点不需要加入标注
    for (let i = 0; i < _creatingLines.shapes.length - 1; i++) {
      const shape = _creatingLines.shapes[i];

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
    const data: LineData = {
      id: uuid(),
      type: 'line',
      pointList: points,
      label: this.activeLabel,
      order: monitor!.getNextOrder(),
    };

    this._addAnnotation(data);

    _creatingLines.destroy();
    this._creatingLines = null;
    axis!.rerender();
    this.onSelect(new MouseEvent(''), this.drawing!.get(data.id) as AnnotationLine);
    monitor!.setSelectedAnnotationId(data.id);
  }

  private _archiveCurves() {
    const { _creatingCurves } = this;

    if (!_creatingCurves) {
      return;
    }

    const points: PointItem[] = [];
    // 最后一个点不需要加入标注
    // 以四个图形为一组，分别是曲线、连接线，开始控制点、结束控制点，当前的i表示结束控制点
    const controlPoints: AxisPoint[] = [];

    for (let i = 0; i < _creatingCurves.shapes.length - 4; i += 4) {
      const curve = _creatingCurves.shapes[i] as BezierCurve;

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
    const data: LineData = {
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
    this.onSelect(new MouseEvent(''), this.drawing!.get(data.id) as AnnotationLine);
    monitor!.setSelectedAnnotationId(data.id);
  }

  public deactivate(): void {
    super.deactivate();
    this._archiveDraft();
    axis!.rerender();
  }

  public render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    if (this._creatingLines) {
      this._creatingLines.render(ctx);
    }

    if (this._creatingCurves) {
      this._creatingCurves.render(ctx);
    }
  }

  public destroy(): void {
    super.destroy();

    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
  }
}
