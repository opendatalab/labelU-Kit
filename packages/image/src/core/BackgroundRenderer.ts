import type { RendererOptions } from './Renderer';
import { Renderer } from './Renderer';
import { axis } from '../singletons';
import type { AxisPoint } from '../shapes';

const ImageProperties = ['contrast', 'saturation', 'brightness'] as const;

export interface ImageOption extends RendererOptions {
  url?: string;
  /**
   * 旋转角度
   *
   * @default 0
   */
  rotate?: number;

  /**
   * 对比度
   *
   * @default 0
   */
  contrast?: number;

  /**
   * 饱和度
   *
   * @default 0
   */
  saturation?: number;

  /**
   * 曝光度
   *
   * @default 0
   */
  brightness?: number;
}

export class BackgroundRenderer extends Renderer {
  static DEFAULT_OPTIONS: ImageOption = {
    container: document.body,
    rotate: 0,
    contrast: 0,
    saturation: 0,
    brightness: 0,
    width: 0,
    height: 0,
  };

  private _image: HTMLImageElement | null = null;

  private _initialScale = 1;

  private _unRotatedWidth: number = 0;

  private _unRotatedHeight: number = 0;

  private _rotatedWidth: number = 0;

  private _rotatedHeight: number = 0;

  private _initialCoordinate: AxisPoint = {
    x: 0,
    y: 0,
  };

  private _rotate: number = 0;

  private _imageUrl: string | null = null;

  public options: ImageOption = BackgroundRenderer.DEFAULT_OPTIONS;

  constructor(options: ImageOption) {
    super({
      ...BackgroundRenderer.DEFAULT_OPTIONS,
      ...options,
    });
    this._rotate = options.rotate || 0;
  }
  static createImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = () => {
        resolve(image);
      };

      image.onerror = (err) => {
        reject(err);
      };
    });
  }

  private _setImageOffset() {
    const { _image, _rotate } = this;
    const { width, height } = this.options;

    const containerSizeRatio = width / height;

    if (!_image) {
      return;
    }

    const imageWidth = _image.width;
    const imageHeight = _image.height;

    let rotatedImageWidth = imageWidth;
    let rotatedImageHeight = imageHeight;

    const multiple = Math.abs(_rotate) % 180;

    switch (multiple) {
      case 90:
        rotatedImageWidth = imageHeight;
        rotatedImageHeight = imageWidth;
        break;

      case 0:
      default:
        rotatedImageWidth = imageWidth;
        rotatedImageHeight = imageHeight;
        break;
    }

    const imageRatio = rotatedImageWidth / rotatedImageHeight;
    let unRotatedWidth = imageWidth;
    let unRotatedHeight = imageHeight;
    let rotatedWidth = rotatedImageWidth;
    let rotatedHeight = rotatedImageHeight;

    // 根据最小比例进行缩放以避免图片被裁剪或遮挡
    if (imageRatio > containerSizeRatio) {
      rotatedWidth = width;
      rotatedHeight = (rotatedImageHeight * width) / rotatedImageWidth;
    } else {
      rotatedHeight = height;
      rotatedWidth = (rotatedImageWidth * height) / rotatedImageHeight;
    }

    switch (multiple) {
      case 90:
        unRotatedWidth = rotatedHeight;
        unRotatedHeight = rotatedWidth;
        break;

      case 0:
      default:
        unRotatedWidth = rotatedWidth;
        unRotatedHeight = rotatedHeight;
        break;
    }

    const offsetX = (width - rotatedWidth) / 2;
    const offsetY = (height - rotatedHeight) / 2;

    this._unRotatedWidth = unRotatedWidth;
    this._unRotatedHeight = unRotatedHeight;
    this._rotatedWidth = rotatedWidth;
    this._rotatedHeight = rotatedHeight;

    this._initialCoordinate = {
      x: offsetX,
      y: offsetY,
    };

    axis!.initialBackgroundOffset = {
      x: offsetX,
      y: offsetY,
    };

    this._initialScale = unRotatedWidth / imageWidth;

    axis!.initialBackgroundScale = this._initialScale;
  }

  /**
   * 渲染图片，只渲染一张图片（多次调用会清除先前的渲染）
   * @param url 图片URL
   * @returns this
   */
  public loadImage(url: string, options: Omit<ImageOption, 'url'> | undefined): Promise<this> {
    if (!url) {
      throw new Error('image url is required');
    }

    this._imageUrl = url;

    if (options) {
      Object.assign(this.options, options);
    }

    if (!this.ctx) {
      return Promise.reject(new Error('canvas context is null'));
    }

    return BackgroundRenderer.createImage(this._imageUrl).then((_image) => {
      this._image = _image;

      this._setImageOffset();

      this.render();

      return this;
    });
  }

  /**
   * 旋转图片
   * @param deg 旋转角度
   */
  public rotate(deg: number) {
    this._rotate = deg;
    this.options.rotate = deg;
    this._setImageOffset();
    this.render();
  }

  /**
   * 设置图片属性
   * @param key 属性名 contrast | saturation | brightness
   * @param value 属性值 -100 ~ 100
   */
  public attr(key: 'contrast' | 'saturation' | 'brightness', value: number) {
    if (!ImageProperties.includes(key)) {
      throw new Error(`invalid image property ${key}. Valid properties are ${ImageProperties.join(', ')}`);
    }

    if (!this.ctx) {
      return;
    }

    Object.assign(this.options, { [key]: value });

    const { ctx, options } = this;
    ctx.filter = `brightness(${options.brightness! + 100}%) contrast(${options.contrast! + 100}%) saturate(${
      options.saturation! + 100
    }%)`;

    this.clear();
    this.render();
  }

  public get image() {
    return this._image;
  }

  public get rotateDegree() {
    return this._rotate;
  }

  public destroy() {
    this.clear();
    this.canvas.remove();
  }

  public clear() {
    if (!this.ctx) {
      return;
    }

    const { canvas } = this;

    // 清除画布，包括旋转后的画布
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, canvas.width * 10, canvas.height * 10);
    this.ctx.restore();
  }

  public render() {
    const { ctx, canvas, _initialCoordinate, _rotatedWidth, _rotatedHeight, _unRotatedWidth, _unRotatedHeight } = this;

    if (!ctx) {
      return;
    }

    if (!this._image) {
      return;
    }

    const { scale } = axis!;

    const coord = axis!.getScaledCoord(_initialCoordinate);

    const bbox = {
      minX: coord.x,
      minY: coord.y,
      maxX: coord.x + _rotatedWidth * scale,
      maxY: coord.y + _rotatedHeight * scale,
    };

    // 更新图片区域
    axis!.setSafeZone(bbox);

    ctx.save();

    ctx.fillStyle = '#333';
    // 整个画布填充背景色
    // 避免网页缩放后清空画布不完全
    ctx.fillRect(0, 0, canvas.width * 10, canvas.height * 10);

    // 将坐标原点移到图片中心
    ctx.translate(coord.x + (_rotatedWidth * scale) / 2, coord.y + (_rotatedHeight * scale) / 2);
    // 执行旋转操作
    const angleInRadians = (this._rotate * Math.PI) / 180;

    ctx.rotate(angleInRadians);

    // 将坐标原点移回画布左上角，并画出图像
    ctx.drawImage(
      this._image,
      (-_unRotatedWidth * scale) / 2,
      (-_unRotatedHeight * scale) / 2,
      _unRotatedWidth * scale,
      _unRotatedHeight * scale,
    );

    ctx.restore();

    return this;
  }
}
