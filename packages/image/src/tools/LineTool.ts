import type { LineStyle } from '../graphics/Line';
import { Line } from '../graphics/Line';
import { ETool } from '../enums';
import type { AxisPoint } from '../graphics/Point';
import type { BasicToolParams } from './Tool';
import { Tool } from './Tool';
import type { BasicImageAnnotation } from './interface';

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
  static toolName = ETool.Line;

  public style: LineStyle = Line.DEFAULT_STYLE;

  private _elements: Line[] = [];

  // TODO: 绘制过程
  public draw() {
    console.log('drawing');
  }

  render(ctx: CanvasRenderingContext2D) {
    const { data = [], style, axis } = this;

    this._elements = [];

    for (const item of data) {
      for (let i = 1; i < item.pointList.length; i++) {
        const startPoint = item.pointList[i - 1];
        const endPoint = item.pointList[i];
        const label = this.getLabelByValue(item.label);

        const startCoord = axis.getScaledCoord(startPoint);
        const endCoord = axis.getScaledCoord(endPoint);

        const line = new Line(
          {
            x1: startCoord.x,
            y1: startCoord.y,
            x2: endCoord.x,
            y2: endCoord.y,
          },
          {
            ...style,
            stroke: label?.color || style.stroke,
          },
        );

        line.render(ctx!);
        this._elements.push(line);
      }
    }
  }
}
