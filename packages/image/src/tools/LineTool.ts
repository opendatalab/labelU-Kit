import type { LineStyle } from '../graphics/Line';
import { Line } from '../graphics/Line';
import { ETool } from '../enums';
import type { PointItem } from './Point';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { Axis } from '../core/Axis';

export interface LineData {
  id: string;
  pointList: PointItem[];
  order: number;
  valid?: boolean;
  /** 标签分类 */
  label?: string;
  /** 标签分类属性 */
  attributes?: Record<string, string | string[]>;
}

export interface LineToolOptions extends BasicToolParams<LineData> {
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

export class LineTool extends Tool<LineData, LineToolOptions> {
  static toolName = ETool.Line;

  public style: LineStyle = {
    stroke: '#000',
    strokeWidth: 2,
    opacity: 1,
  };

  constructor({ data, ...config }: LineToolOptions, axis: Axis) {
    super(data, config, axis);
  }

  public draw() {
    console.log('drawing');
  }

  render(ctx: CanvasRenderingContext2D) {
    const { data = [], labelMapping, style, axis } = this;
    const lines = [];

    for (const item of data) {
      for (let i = 1; i < item.pointList.length; i++) {
        const startPoint = item.pointList[i - 1];
        const endPoint = item.pointList[i];
        const lineToolLabel = labelMapping.get(item.label || '');

        const startCoord = axis!.getScaledCoord(startPoint);
        const endCoord = axis!.getScaledCoord(endPoint);

        const line = new Line({
          x1: startCoord.x,
          y1: startCoord.y,
          x2: endCoord.x,
          y2: endCoord.y,
          style: {
            ...style,
            stroke: lineToolLabel?.color || style.stroke,
          },
        });

        line.render(ctx!);
        lines.push(line);
      }
    }
  }
}
