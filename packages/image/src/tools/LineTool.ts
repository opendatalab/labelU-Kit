import type { ILabel } from '@labelu/interface';

import type { LineStyle } from '../graphics/Line';
import { Line } from '../graphics/Line';
import { EInternalEvent, ETool } from '../enums';
import type { AxisPoint } from '../graphics/Point';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { BasicImageAnnotation } from './interface';
import type { Axis, RBushItem } from '../core/Axis';
import { throttle } from '../decorators/throttle';
import { LinePen } from '../pen';
import { getDistance } from './math.util';

export interface PointItem extends AxisPoint {
  id: string;
}

export interface LineData extends BasicImageAnnotation {
  pointList: PointItem[];
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

export class LineTool extends Tool<LineData, LineStyle, LineToolOptions> {
  /**
   * Rbush 碰撞检测阈值
   *
   * TODO: 阈值是否可配置
   */
  static DISTANCE_THRESHOLD = 2;

  public toolName = ETool.Line;

  public style: Required<LineStyle> = Line.DEFAULT_STYLE;

  /** 所有线条集合 */
  private _elements: Line[] = [];

  /** 按线段分组id对标注的映射 */
  private _annotationToLineMapping: Map<string, Line[]> = new Map();

  /** 线段端点对标注id的映射 */
  private _pointToAnnotationMapping: Map<string, string> = new Map();

  /** 端点对线段的映射 */
  private _pointToLineMapping: Map<string, Line> = new Map();

  /**
   * 当前鼠标悬浮的标注id
   *
   * @description 目前先支持高亮一个标注
   */
  private _hoveredId: string = '';

  /**
   * 标线工具画笔
   *
   * @description 只有当工具进入绘制状态后才会创建
   */
  private _pen: LinePen<LineTool> | null = null;

  /**
   * TODO: 高亮样式
   *
   * @default stroke: '#f60', strokeWidth: 4
   */
  public hoveredStyle: LineStyle = {
    stroke: '#f60',
    strokeWidth: 4,
  };

  constructor(params: LineToolOptions, axis: Axis) {
    super(params, axis);

    this._insertRBushTree();
    this.axis.on(EInternalEvent.Move, this._handleMouseOver.bind(this));

    // 只有拖拽和缩放才更新rbush
    this.axis.on(EInternalEvent.MoveEnd, this._insertRBushTree.bind(this));
    this.axis.on(EInternalEvent.Zoom, this._insertRBushTree.bind(this));
  }

  private _handleMouseOver(e: MouseEvent, items: RBushItem[], mouseCoord: AxisPoint) {
    const annotationId = this.getAnnotationIdUnderCursor(mouseCoord, items);

    if (!annotationId) {
      this._setHoveredId('');
    } else {
      this.axis.annotator?.emit('hover', e, this.data);
      this._setHoveredId(annotationId);
    }
  }

  private _setHoveredId(id: string) {
    this._hoveredId = id;
  }

  /**
   * 通过rbushItem计算鼠标到线段的距离
   *
   * @description
   *
   * 注意：不能直接使用RbushItem的坐标，因为这个坐标是从左上角开始的，而线段并非总是从左上角开始的
   *
   * @param mouseCoord 鼠标坐标
   * @param item rbushItem
   * @returns 鼠标到线段的距离
   */
  private _getDistanceToLine(mouseCoord: AxisPoint, item: RBushItem) {
    const line = this._pointToLineMapping.get(item.id);

    if (!line) {
      throw Error('Line not found!');
    }

    const start = { x: line.coordinate.x1, y: line.coordinate.y1 };
    const end = { x: line.coordinate.x2, y: line.coordinate.y2 };

    return this._getDistanceToLineSegment(mouseCoord, start, end);
  }

  private _getDistanceToLineSegment(point: AxisPoint, start: AxisPoint, end: AxisPoint) {
    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;
    const { x: x3, y: y3 } = point;

    const px = x2 - x1;
    const py = y2 - y1;
    const something = px * px + py * py;
    const u = ((x3 - x1) * px + (y3 - y1) * py) / something;

    if (u > 1) {
      return getDistance(point, end);
    }

    if (u < 0) {
      return getDistance(point, start);
    }

    const x = x1 + u * px;
    const y = y1 + u * py;

    return getDistance(point, { x, y });
  }

  @throttle(100)
  private _insertRBushTree() {
    const { data, axis, rbushElementMapping } = this;

    if (!Array.isArray(data)) {
      throw Error('Data must be an array!');
    }

    for (const item of data) {
      for (let i = 1; i < item.pointList.length; i++) {
        const startPoint = axis.getScaledCoord(item.pointList[i - 1]);
        const endPoint = axis.getScaledCoord(item.pointList[i]);

        const rbushItem = {
          type: ETool.Line,
          id: item.pointList[i - 1].id,
          minX: Math.min(startPoint.x, endPoint.x),
          minY: Math.min(startPoint.y, endPoint.y),
          maxX: Math.max(startPoint.x, endPoint.x),
          maxY: Math.max(startPoint.y, endPoint.y),
        };

        const cachedRBushItem = rbushElementMapping.get(rbushItem.id);

        if (cachedRBushItem) {
          axis.rbush.remove(cachedRBushItem);

          cachedRBushItem.minX = Math.min(rbushItem.minX, rbushItem.minX);
          cachedRBushItem.minY = Math.min(rbushItem.minY, rbushItem.minY);
          cachedRBushItem.maxX = Math.max(rbushItem.maxX, rbushItem.maxX);
          cachedRBushItem.maxY = Math.max(rbushItem.maxY, rbushItem.maxY);
        }

        rbushElementMapping.set(rbushItem.id, rbushItem);

        axis.rbush.insert(rbushItem);
      }
    }
  }

  public getAnnotation(annotationId: string) {
    return this._annotationToLineMapping.get(annotationId);
  }

  /**
   * 获取在鼠标指针下的标注id
   * NOTE: 目前先支持获取一个标注
   * @param mouseCoord 鼠标坐标
   * @param rbushItems rbushItems
   * @returns 标注id
   */
  public getAnnotationIdUnderCursor(mouseCoord: AxisPoint, rbushItems: RBushItem[]) {
    const { style, _pointToAnnotationMapping } = this;
    const points = rbushItems.filter((item) => item.type === ETool.Line && this.rbushElementMapping.has(item.id));

    if (points.length === 0) {
      return;
    }

    for (const item of points) {
      const distance = this._getDistanceToLine(mouseCoord, item);

      if (distance < LineTool.DISTANCE_THRESHOLD + style.strokeWidth / 2) {
        const annotationId = _pointToAnnotationMapping.get(item.id);
        if (!annotationId) {
          throw Error(`Annotation not found! point id is ${item.id} `);
        }

        return annotationId;
      }
    }
  }

  /**
   * 创建绘制器
   */
  public pen(label: string | ILabel) {
    this._pen = new LinePen(this, label);
  }

  public render(ctx: CanvasRenderingContext2D) {
    const {
      data = [],
      style,
      axis,
      hoveredStyle,
      _pointToLineMapping,
      _annotationToLineMapping,
      _pointToAnnotationMapping,
    } = this;

    this._elements = [];
    _pointToLineMapping.clear();
    _pointToAnnotationMapping.clear();
    _annotationToLineMapping.clear();

    for (const item of data) {
      _annotationToLineMapping.set(item.id, []);

      for (let i = 1; i < item.pointList.length; i++) {
        const startPoint = item.pointList[i - 1];
        const endPoint = item.pointList[i];
        const label = this.getLabelByValue(item.label);

        const startCoord = axis.getScaledCoord(startPoint);
        const endCoord = axis.getScaledCoord(endPoint);

        const line = new Line(
          startPoint.id,
          {
            x1: startCoord.x,
            y1: startCoord.y,
            x2: endCoord.x,
            y2: endCoord.y,
          },
          {
            ...style,
            stroke: label?.color || style.stroke,
            ...(this._hoveredId === item.id ? { ...hoveredStyle } : {}),
          },
        );

        line.render(ctx!);

        this._elements.push(line);
        _pointToLineMapping.set(startPoint.id, line);
        _pointToAnnotationMapping.set(startPoint.id, item.id);
        _annotationToLineMapping.get(item.id)?.push(line);
      }
    }
  }

  public destroy() {
    super.destroy();

    this._annotationToLineMapping.clear();
    this._pointToAnnotationMapping.clear();
    this._pointToLineMapping.clear();
    this._elements = [];
    this._pen?.destroy();
    this._pen = null;
  }
}
