import type { Axis } from '../core/Axis';
import { ETool } from '../enums';
import type { AxisPoint, PointStyle } from '../graphics/Point';
import { Point } from '../graphics/Point';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { BasicImageAnnotation } from './interface';

export type PointData = BasicImageAnnotation & AxisPoint;

/**
 * 点标注工具配置
 */
export interface PointToolOptions extends BasicToolParams<PointData, PointStyle> {
  /**
   * 上限点数
   *
   * @default undefined 默认无限制
   */
  maxPointAmount?: number;

  /**
   * 下限点数
   *
   * @default 0
   */
  minPointAmount?: number;

  /**
   * 画布外标注
   * @default true;
   */
  outOfCanvas?: boolean;

  /**
   * 边缘吸附
   * @default true;
   */
  edgeAdsorptive?: boolean;
}

export class PointTool extends Tool<PointData, PointStyle, PointToolOptions> {
  public toolName = ETool.Point;

  private _elements: Point[] = [];

  public style: Required<PointStyle> = Point.DEFAULT_STYLE;

  constructor(params: PointToolOptions, axis: Axis) {
    super(params, axis);

    this._insertRBushTree();
  }

  private _insertRBushTree() {
    const { data, axis } = this;

    if (!Array.isArray(data)) {
      throw Error('Data must be an array!');
    }

    for (const item of data) {
      const rbushItem = { id: item.id, type: ETool.Point, ...this._calcPointRNodeMatrix(item) };

      this.rbushElementMapping.set(rbushItem.id, rbushItem);
      axis.rbush.insert(rbushItem);
    }
  }

  private _calcPointRNodeMatrix(point: AxisPoint) {
    const { style } = this;
    const { x, y } = point;
    const { radius } = style;

    return {
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    };
  }

  render(ctx: CanvasRenderingContext2D) {
    const { data = [], style, axis } = this;

    this._elements = [];

    for (const item of data) {
      const label = this.getLabelByValue(item.label);
      const coord = axis.getScaledCoord(item);

      const point = new Point(item.id, coord, {
        ...style,
        stroke: label?.color || style.stroke,
      });

      point.render(ctx!);
      this._elements.push(point);
    }
  }
}
