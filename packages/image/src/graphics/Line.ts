import { CanvasObject } from './CanvasObject';

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

export class Line extends CanvasObject<LineStyle, LineCoordinate> {
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

  /**
   * 获取线段的包围盒
   * NOTE: 是否需要加上线宽？
   */
  public getBBox() {
    const { x1, y1, x2, y2 } = this.coordinate;

    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    };
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
