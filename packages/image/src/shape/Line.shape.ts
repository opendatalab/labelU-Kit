import { Shape } from './Shape';
import type { AxisPoint } from './Point.shape';

export interface LineStyle {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

type LineCoordinate = [
  /** 起始点 */
  AxisPoint,
  /** 结束点 */
  AxisPoint,
];

export class Line extends Shape<LineStyle> {
  static DEFAULT_STYLE: Required<LineStyle> = {
    stroke: '#000',
    strokeWidth: 2,
    opacity: 1,
  };

  public style: Required<LineStyle> = Line.DEFAULT_STYLE;

  constructor(id: string, coordinate: LineCoordinate, style: LineStyle) {
    super(id, coordinate);

    if (style) {
      this.style = { ...this.style, ...style };
    }
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, dynamicCoordinate } = this;
    const { stroke, strokeWidth, opacity } = style;
    const [start, end] = dynamicCoordinate;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
