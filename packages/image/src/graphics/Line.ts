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

export interface LineParams extends LineCoordinate {
  /** 线条样式 */
  style?: LineStyle;
}

export class Line {
  public coordinate: LineCoordinate;

  public style: Required<LineStyle> = {
    stroke: '#000',
    strokeWidth: 2,
    opacity: 1,
  };

  constructor({ x1, y1, x2, y2, style }: LineParams) {
    this.coordinate = {
      x1,
      y1,
      x2,
      y2,
    };

    if (style) {
      this.style = style as Required<LineStyle>;
    }
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, coordinate } = this;
    const { stroke, strokeWidth } = style;
    const { x1, y1, x2, y2 } = coordinate;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    ctx.stroke();
    ctx.restore();
  }
}
