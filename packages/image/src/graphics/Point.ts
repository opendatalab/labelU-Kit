export interface AxisPoint {
  x: number;
  y: number;
}

export interface PointStyle {
  /**
   * 点边框颜色
   *
   * @default #000
   */
  stroke?: string;

  /**
   * 点边框宽度
   *
   * @default 0
   */
  strokeWidth?: number;

  /**
   * 点填充颜色
   *
   * @default #000
   */
  fill?: string;

  /**
   * 点半径
   *
   * @default 2
   */
  radius?: number;

  /**
   * 点透明度
   *
   * @default 1
   */
  opacity?: number;

  /**
   * 点起始角度
   *
   * @default 0
   */
  startAngle?: number;

  /**
   * 点结束角度
   *
   * @default Math.PI * 2
   */
  endAngle?: number;
}

/**
 * 基础图形点
 */
export class Point {
  static DEFAULT_STYLE: Required<PointStyle> = {
    stroke: '#000',
    strokeWidth: 0,
    fill: '#000',
    radius: 2,
    opacity: 1,
    startAngle: 0,
    endAngle: Math.PI * 2,
  };

  public coordinate: AxisPoint;

  public style: Required<PointStyle> = Point.DEFAULT_STYLE;

  constructor(coordinate: AxisPoint, style: PointStyle) {
    this.coordinate = coordinate;

    if (style) {
      this.style = style as Required<PointStyle>;
    }
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, coordinate } = this;
    const { stroke, strokeWidth, radius, fill, opacity, startAngle, endAngle } = style;
    const { x, y } = coordinate;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    ctx.lineWidth = strokeWidth;

    ctx.globalAlpha = opacity;
    ctx.beginPath();

    ctx.arc(x, y, radius, startAngle, endAngle, false);
    ctx.stroke();
    ctx.fill();

    // 恢复透明度
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
