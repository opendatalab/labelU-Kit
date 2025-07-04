import cloneDeep from 'lodash.clonedeep';

import { DEFAULT_LABEL_COLOR } from '../constant';
import { axis } from '../singletons';
import type { AxisPoint } from './Point.shape';
import { Shape } from './Shape';

export interface RectStyle {
  /**
   * 边框颜色
   *
   * @default #999
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

export interface RectParams {
  id: string;
  coordinate: AxisPoint;
  width: number;
  height: number;
  style: RectStyle;
}

/**
 * 基础图形点
 */
export class Rect extends Shape<RectStyle> {
  static DEFAULT_STYLE: Required<RectStyle> = {
    stroke: DEFAULT_LABEL_COLOR,
    strokeWidth: 2,
    fill: 'transparent',
    opacity: 1,
  };

  public style: Required<RectStyle> = Rect.DEFAULT_STYLE;

  private _width: number = 0;

  private _height: number = 0;

  private _scaledWidth: number = 0;

  private _scaledHeight: number = 0;

  constructor({ id, coordinate, width, height, style }: RectParams) {
    super(id, coordinate);

    this._width = width;
    this._height = height;

    if (style) {
      this.style = { ...this.style, ...style };
    }

    this.onCoordinateChange(() => {
      const { _width: settledWidth, _height: settledHeight, dynamicCoordinate } = this;
      const [{ x, y }] = dynamicCoordinate;

      const maxX = x + settledWidth * axis!.scale;
      const maxY = y + settledHeight * axis!.scale;

      this._scaledWidth = settledWidth * axis!.scale;
      this._scaledHeight = settledHeight * axis!.scale;

      this.bbox = {
        minX: x,
        minY: y,
        maxX,
        maxY,
      };
    });
  }

  public serialize() {
    const { id, style, plainCoordinate, dynamicCoordinate, _width, _height } = this;

    return {
      id,
      coordinate: cloneDeep(plainCoordinate),
      dynamicCoordinate: cloneDeep(dynamicCoordinate),
      width: _width,
      height: _height,
      dynamicWidth: this._scaledWidth,
      dynamicHeight: this._scaledHeight,
      style,
    };
  }

  public get dynamicHeight() {
    return this._scaledHeight;
  }

  public get dynamicWidth() {
    return this._scaledWidth;
  }

  public set width(width: number) {
    this._width = width;
    this.update();
  }

  public get width() {
    return this._width;
  }

  public set height(height: number) {
    this._height = height;
    this.update();
  }

  public get height() {
    return this._height;
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
