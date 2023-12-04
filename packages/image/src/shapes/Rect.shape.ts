import { axis } from '../singletons';
import type { AxisPoint } from './Point.shape';
import { Shape } from './Shape';

export interface RectStyle {
  /**
   * 边框颜色
   *
   * @default #000
   */
  stroke?: string;

  /**
   * 边框宽度
   *
   * @default 0
   */
  strokeWidth?: number;

  /**
   * 填充颜色
   *
   * @default #undefined
   */
  fill?: string;

  /**
   * 点透明度
   *
   * @default 1
   */
  opacity?: number;
}

/**
 * 基础图形点
 */
export class Rect extends Shape<RectStyle> {
  static DEFAULT_STYLE: Required<RectStyle> = {
    stroke: '#000',
    strokeWidth: 0,
    fill: 'transparent',
    opacity: 1,
  };

  public style: Required<RectStyle> = Rect.DEFAULT_STYLE;

  public width: number = 0;

  public height: number = 0;

  constructor(id: string, coordinate: AxisPoint, width: number, height: number, style: RectStyle) {
    super(id, coordinate);

    this.width = width;
    this.height = height;

    if (style) {
      this.style = { ...this.style, ...style };
    }

    this.setBBoxUpdater(() => {
      const [{ x, y }] = this.dynamicCoordinate;

      return {
        minX: x,
        minY: y,
        maxX: x + width * axis!.scale,
        maxY: y + height * axis!.scale,
      };
    });
  }

  /**
   * 是否在鼠标指针下
   *
   * @param mouseCoord 鼠标坐标
   */
  public isUnderCursor(mouseCoord: AxisPoint) {
    const { bbox } = this;

    if (
      mouseCoord.x >= bbox.minX &&
      mouseCoord.x <= bbox.maxX &&
      mouseCoord.y >= bbox.minY &&
      mouseCoord.y <= bbox.maxY
    ) {
      return true;
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, dynamicCoordinate, bbox } = this;
    const { stroke, strokeWidth, fill, opacity } = style;
    const [{ x, y }] = dynamicCoordinate;

    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    ctx.lineWidth = strokeWidth;

    ctx.globalAlpha = opacity;
    ctx.beginPath();

    ctx.rect(x, y, bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
    ctx.stroke();
    ctx.fill();

    // 恢复透明度
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
