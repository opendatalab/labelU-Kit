import type { LineStyle } from '../graphics/Line';
import { Line } from '../graphics/Line';
import { ETool } from '../enums';
import type { AxisPoint } from '../graphics/Point';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { BasicImageAnnotation } from './interface';
import type { Axis, RBushItem } from '../core/Axis';

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

  static toolName = ETool.Line;

  public style: LineStyle = Line.DEFAULT_STYLE;

  private _elements: Line[] = [];

  private _hoveredId: string = '';

  public hoveredStyle: LineStyle = {
    stroke: '#f60',
    strokeWidth: 4,
  };

  constructor(params: LineToolOptions, axis: Axis) {
    super(params, axis);

    this._insertRBushTree();
    this.axis.on('__axis__:move', this._handleMouseOver.bind(this));
  }

  private _handleMouseOver(items: RBushItem[], mouseCoord: AxisPoint, e: MouseEvent) {
    const lineItems = items.filter((item) => item.type === ETool.Line && this.rbushElementMapping.has(item.id));
    console.log(items, lineItems, this.rbushElementMapping.keys());

    if (lineItems.length === 0) {
      return;
    }

    let isHovered = false;

    const distances = [];
    for (const item of lineItems) {
      const distance = this._getDistanceToLine(mouseCoord, item);

      distances.push(distance);
      if (items.length === lineItems.length) {
        console.log('distance', distances);
      }
      if (distance < LineTool.DISTANCE_THRESHOLD) {
        isHovered = true;
        // 触发 hover 事件
        this.axis.annotator?.emit('hover', this.data, e);
        console.log('hovered', item.id);
        this._setHoveredId(item.id);
      }
    }

    if (!isHovered) {
      this._setHoveredId('');
    }
  }

  private _setHoveredId(id: string) {
    this._hoveredId = id;
  }

  private _getDistanceToLine(point: AxisPoint, line: RBushItem) {
    const { axis } = this;
    const { minX, minY, maxX, maxY } = line;
    const { x, y } = point;

    const start = axis.getScaledCoord({ x: minX, y: minY });
    const end = axis.getScaledCoord({ x: maxX, y: maxY });

    if (x < minX) {
      return this._getDistanceToLineSegment(point, start, axis.getScaledCoord({ x: minX, y: maxY }));
    }

    if (x > maxX) {
      return this._getDistanceToLineSegment(point, axis.getScaledCoord({ x: maxX, y: minY }), end);
    }

    if (y < minY) {
      return this._getDistanceToLineSegment(point, start, axis.getScaledCoord({ x: maxX, y: minY }));
    }

    if (y > maxY) {
      return this._getDistanceToLineSegment(point, axis.getScaledCoord({ x: minX, y: maxY }), end);
    }

    return this._getDistanceToLineSegment(point, start, end);
  }

  private _getDistanceToLineSegment(point: AxisPoint, start: AxisPoint, end: AxisPoint) {
    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;
    const { x: x3, y: y3 } = point;

    const numerator = Math.abs((y2 - y1) * x3 - (x2 - x1) * y3 + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

    return numerator / denominator;
  }

  private _insertRBushTree() {
    const { data, axis } = this;

    if (!Array.isArray(data)) {
      throw Error('Data must be an array!');
    }

    for (const item of data) {
      for (let i = 1; i < item.pointList.length; i++) {
        const startPoint = item.pointList[i - 1];
        const endPoint = item.pointList[i];

        const rbushItem = {
          type: ETool.Line,
          id: startPoint.id,
          minX: Math.min(startPoint.x, endPoint.x),
          minY: Math.min(startPoint.y, endPoint.y),
          maxX: Math.max(startPoint.x, endPoint.x),
          maxY: Math.max(startPoint.y, endPoint.y),
        };

        this.rbushElementMapping.set(startPoint.id, rbushItem);
        axis.rbush.insert(rbushItem);
      }
    }
  }

  // TODO: 绘制过程
  public draw() {
    console.log('drawing');
  }

  render(ctx: CanvasRenderingContext2D) {
    const { data = [], style, axis, hoveredStyle } = this;

    this._elements = [];

    for (const item of data) {
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
            ...(this._hoveredId === startPoint.id ? { ...hoveredStyle } : {}),
          },
        );

        line.render(ctx!);
        this._elements.push(line);
      }
    }
  }

  destroy() {
    super.destroy();

    this._elements = [];
  }
}
