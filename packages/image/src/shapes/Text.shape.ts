import { Shape } from './Shape';
import type { AxisPoint } from './Point.shape';

export interface TextStyle {
  /**
   * 字号设置
   *
   * @default 14
   */
  fontSize?: number;

  /**
   * 字体
   *
   * @default Arial
   */
  fontFamily?: string;

  /** 字体颜色 */
  fill: string;

  /**
   * 描边颜色
   */
  stroke?: string;

  /**
   * 描边宽度
   */
  strokeWidth?: number;

  /**
   * 透明度
   *
   * @default 1
   */
  opacity?: number;
}

export interface TextParams {
  id: string;
  coordinate: AxisPoint;
  text: string;
  style: TextStyle;
}

const MARGIN = 5;
const MAX_WIDTH = 100;
const LINE_HEIGHT = 20;

export class ShapeText extends Shape<TextStyle> {
  public style: Required<TextStyle> = {
    fontSize: 14,
    fontFamily: 'Arial',
    stroke: 'transparent',
    strokeWidth: 0,
    fill: '#000',
    opacity: 1,
  };

  public text: string;

  constructor({ id, style, text, coordinate }: TextParams) {
    super(id, coordinate);
    this.text = text;
    this.style = {
      ...this.style,
      ...style,
    };

    this.onCoordinateChange(() => {
      const { dynamicCoordinate, style: latestStyle } = this;
      const [{ x, y }] = dynamicCoordinate;

      const width = latestStyle.fontSize * text.length;
      const height = latestStyle.fontSize;

      this.bbox = {
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
      };
    });
  }

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

  public render(ctx: CanvasRenderingContext2D) {
    const { dynamicCoordinate, style, text } = this;
    const [{ x, y }] = dynamicCoordinate;
    const { fontSize, opacity, fontFamily, fill, stroke, strokeWidth } = style;

    ctx.save();

    ctx.globalAlpha = opacity!;
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 5;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    let line = '';
    let testLine = '';
    const textX = x + MARGIN;
    let textY = y + MARGIN + fontSize;

    for (let n = 0; n < text.length; n++) {
      testLine = line + text[n];
      if (ctx.measureText(testLine).width > MAX_WIDTH) {
        ctx.fillText(line, textX, textY);
        ctx.strokeText(line, textX, textY); // 描边
        line = text[n];
        textY += LINE_HEIGHT;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, textX, textY);
    ctx.strokeText(line, textX, textY); // 描边

    // 恢复透明度
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
