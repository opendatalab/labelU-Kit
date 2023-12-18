import { Shape } from './Shape';
import type { AxisPoint } from './Point.shape';
import { isPointInPolygon } from './math.util';
import type { LineStyle } from './Line.shape';

export interface PolygonStyle extends LineStyle {
  fill?: string;
}

type PolygonCoordinate = AxisPoint[];

export interface PolygonParams {
  id: string;
  coordinate: PolygonCoordinate;
  style?: PolygonStyle;
}

/**
 * 多边形
 */
export class Polygon extends Shape<PolygonStyle> {
  /**
   * Rbush 碰撞检测阈值
   *
   * TODO: 阈值是否可配置
   */
  static DISTANCE_THRESHOLD = 2 as const;

  static DEFAULT_STYLE: Required<PolygonStyle> = {
    stroke: '#000',
    strokeWidth: 2,
    opacity: 1,
    fill: 'rgba(0, 0, 0, 0.5)',
  };

  public style: Required<PolygonStyle> = Polygon.DEFAULT_STYLE;

  constructor({ id, coordinate, style }: PolygonParams) {
    super(id, coordinate);

    if (style) {
      this.style = { ...this.style, ...style };
    }

    this.onCoordinateChange(() => {
      const { style: rendererStyle, dynamicCoordinate } = this;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      for (let i = 0; i < dynamicCoordinate.length; i += 1) {
        const { x, y } = dynamicCoordinate[i];

        if (i === 0) {
          minX = maxX = x;
          minY = maxY = y;
        } else {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }

      const extra = rendererStyle.strokeWidth ?? 0 + Polygon.DISTANCE_THRESHOLD;

      return {
        minX: minX - extra,
        minY: minY - extra,
        maxX: maxX + extra,
        maxY: maxY + extra,
      };
    });
  }

  /**
   * 是否在鼠标指针下
   *
   * @param mouseCoord 鼠标坐标
   */
  public isUnderCursor(mouseCoord: AxisPoint) {
    const { dynamicCoordinate } = this;

    // TODO：阈值
    return isPointInPolygon(mouseCoord, dynamicCoordinate);
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, dynamicCoordinate } = this;
    const { stroke, strokeWidth, opacity } = style;
    const [start] = dynamicCoordinate;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.fillStyle = style.fill ?? 'transparent';
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    const newCoordinate = [...dynamicCoordinate, start];

    for (let i = 1; i < newCoordinate.length; i += 1) {
      const { x, y } = newCoordinate[i];

      ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
