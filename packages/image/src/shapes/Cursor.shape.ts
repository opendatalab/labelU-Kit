import { DEFAULT_LABEL_COLOR } from '../constant';

export interface CursorStyle {
  /** 线条颜色 */
  stroke?: string;

  /** 线条宽度 */
  strokeWidth?: number;

  fill?: string;
}

export interface CursorParams {
  /** 起始点x坐标 */
  x: number;

  /** 起始点y坐标 */
  y: number;

  /** 线条样式 */
  style?: CursorStyle;
}

const dpr = window.devicePixelRatio || 1;

export class Cursor {
  public style: Required<CursorStyle> = {
    stroke: DEFAULT_LABEL_COLOR,
    strokeWidth: dpr,
    fill: '#fff',
  };

  public coordinate: { x: number; y: number } = {
    x: 0,
    y: 0,
  };

  constructor(params: CursorParams) {
    this.coordinate = {
      x: params.x,
      y: params.y,
    };

    if (params.style) {
      this.style = {
        ...this.style,
        ...params.style,
      } as Required<CursorStyle>;
    }
  }

  public updateCoordinate(x: number, y: number) {
    this.coordinate = {
      x,
      y,
    };
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const finalX = this.coordinate.x;
    const finalY = this.coordinate.y;

    if (!finalX && !finalY) {
      return;
    }

    const { stroke, strokeWidth, fill } = this.style;
    const canvas = ctx.canvas;

    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    // 根据给定的坐标在canvas上画十字线
    ctx.beginPath();
    ctx.globalAlpha = 0.8;
    ctx.moveTo(finalX, 0);
    ctx.lineTo(finalX, canvas.height * 10);
    ctx.moveTo(0, finalY);
    ctx.lineTo(canvas.width * 10, finalY);
    ctx.stroke();
    ctx.translate(finalX, finalY);
    // 中心点白色
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = fill;
    ctx.strokeStyle = 'transparent';
    ctx.lineWidth = 0;
    ctx.arc(0, 0, dpr, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.restore();
  }
}
