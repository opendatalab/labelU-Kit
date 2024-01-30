import cloneDeep from 'lodash.clonedeep';

import { Shape } from './Shape';
import type { AxisPoint } from './Point.shape';
import { DEFAULT_LABEL_COLOR } from '../constant';

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
const MAX_WIDTH = 300;
const LINE_HEIGHT = 20;

export class ShapeText extends Shape<TextStyle> {
  public style: Required<TextStyle> = {
    fontSize: 14,
    fontFamily: 'Sans-serif',
    stroke: 'transparent',
    strokeWidth: 0,
    fill: DEFAULT_LABEL_COLOR,
    opacity: 1,
  };

  public text: string;

  private _pixRatio = window.devicePixelRatio || 1;

  private _offscreenCanvas: HTMLCanvasElement = document.createElement('canvas');

  constructor({ id, style, text, coordinate }: TextParams) {
    super(id, coordinate);
    this.text = text;
    this.style = {
      ...this.style,
      ...style,
    };
    this._renderTexts();

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

  /**
   * 渲染文字
   *
   * @description fillText 在Firefox上非常慢，使用离屏canvas渲染
   */
  private _renderTexts() {
    const { text, _offscreenCanvas, style, _pixRatio } = this;
    const { fontSize, fontFamily, fill, stroke, strokeWidth } = style;
    const offCtx = _offscreenCanvas!.getContext('2d')!;

    // 获取设备的像素比
    _offscreenCanvas.style.width = `${_offscreenCanvas.width}px`;
    _offscreenCanvas.style.height = `${_offscreenCanvas.height}px`;

    // 调整 canvas 的大小以匹配设备的像素比
    _offscreenCanvas!.width = _offscreenCanvas!.width * _pixRatio;
    _offscreenCanvas!.height = _offscreenCanvas!.height * _pixRatio;

    offCtx.font = `${fontSize * _pixRatio}px ${fontFamily}`;
    offCtx.fillStyle = fill;
    offCtx.strokeStyle = stroke;
    offCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    offCtx.shadowBlur = 5;
    offCtx.lineWidth = strokeWidth;

    let line = '';
    let letters = '';
    const textX = MARGIN * _pixRatio;
    let textY = (MARGIN + fontSize) * _pixRatio;

    const renderLine = (_line: string, x: number, y: number) => {
      offCtx.strokeText(_line, x, y);
      offCtx.fillText(_line, x, y);
    };

    for (let n = 0; n < text.length; n++) {
      // 换行
      if (text[n] === '\n') {
        renderLine(line, textX, textY);
        line = '';
        textY += LINE_HEIGHT * _pixRatio;
      } else {
        letters = line + text[n];
        if (offCtx.measureText(letters).width > MAX_WIDTH) {
          renderLine(line, textX, textY);
          line = text[n];
          textY += LINE_HEIGHT * _pixRatio;
        } else {
          line = letters;
        }
      }
    }

    renderLine(line, textX, textY);
  }

  public serialize() {
    const { id, style, plainCoordinate, text, dynamicCoordinate } = this;

    return {
      id,
      coordinate: cloneDeep(plainCoordinate),
      dynamicCoordinate: cloneDeep(dynamicCoordinate),
      style,
      text,
    };
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
    const { dynamicCoordinate, style, _offscreenCanvas, _pixRatio } = this;
    const [{ x, y }] = dynamicCoordinate;
    const { opacity } = style;

    ctx.save();

    ctx.globalAlpha = opacity!;

    if (_offscreenCanvas.width && _offscreenCanvas.height) {
      ctx.drawImage(_offscreenCanvas!, x, y, _offscreenCanvas.width / _pixRatio, _offscreenCanvas.height / _pixRatio);
    }

    // 恢复透明度
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
