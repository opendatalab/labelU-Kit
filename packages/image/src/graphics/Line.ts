export interface LineStyle {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

interface LineCoordinate {
  /** 起始点x坐标 */
  x1: number;

  /** 起始点y坐标 */
  y1: number;

  /** 终点x坐标 */
  x2: number;

  /** 终点 y 坐标 */
  y2: number;
}

export class Line {
  static DEFAULT_STYLE: Required<LineStyle> = {
    stroke: '#000',
    strokeWidth: 2,
    opacity: 1,
  };

  public coordinate: LineCoordinate;

  public style: Required<LineStyle> = Line.DEFAULT_STYLE;

  constructor(coordinate: LineCoordinate, style: LineStyle) {
    this.coordinate = coordinate;

    if (style) {
      this.style = style as Required<LineStyle>;
    }
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, coordinate } = this;
    const { stroke, strokeWidth, opacity } = style;
    const { x1, y1, x2, y2 } = coordinate;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
