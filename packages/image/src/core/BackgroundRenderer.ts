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
  private _image: HTMLImageElement | null = null;

  private _initialScale = 1;

  private _renderWidth: number = 0;

  private _renderHeight: number = 0;

  private _initialCoordinate: AxisPoint = {
    x: 0,
    y: 0,
  };

  private _rotate: number = 0;

  private _imageUrl: string | null = null;

  public options: ImageOption = {
    rotate: 0,
    contrast: 0,
    saturation: 0,
    brightness: 0,
    width: 0,
    height: 0,
  } as ImageOption;

  constructor(options: ImageOption) {
    super(options);

    this.options = {
      ...this.options,
      ...options,
    };
    this._rotate = options.rotate || 0;
  }

  /**
   * 创建旋转后的图片
   *
   * @param url 图片URL
   * @param deg 旋转角度
   * @returns Promise<HTMLImageElement>
   */
  static createRotatedImage(url: string, deg: number = 0) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('canvas context is null'));
          return;
        }

        const { width, height } = image;

        // 计算旋转后的图像尺寸
        const angleInRadians = (deg * Math.PI) / 180;
        const rotatedWidth = Math.abs(width * Math.cos(angleInRadians)) + Math.abs(height * Math.sin(angleInRadians));
        const rotatedHeight = Math.abs(height * Math.cos(angleInRadians)) + Math.abs(width * Math.sin(angleInRadians));

        canvas.width = rotatedWidth;
        canvas.height = rotatedHeight;

        ctx.translate(rotatedWidth / 2, rotatedHeight / 2); // 将旋转中心移动到画布中心
        ctx.rotate(angleInRadians);
        ctx.drawImage(image, -width / 2, -height / 2, width, height); // 图像的中心与画布的中心重合

        const rotatedImage = new Image();
        rotatedImage.src = canvas.toDataURL();

        rotatedImage.onload = () => {
          resolve(rotatedImage);
        };

        rotatedImage.onerror = (err) => {
          reject(err);
        };
      };

      image.onerror = (err) => {
        reject(err);
      };
    });
  }

  /**
   * 渲染图片，只渲染一张图片（多次调用会清除先前的渲染）
   * @param url 图片URL
   * @returns this
   */
  public loadImage(url: string, options: Omit<ImageOption, 'url'> | undefined): Promise<this> {
    const { ctx } = this;

    if (!url) {
      throw new Error('image url is required');
    }

    this._imageUrl = url;

    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    if (!ctx) {
      Promise.reject(new Error('canvas context is null'));
    }

    return BackgroundRenderer.createRotatedImage(url, this._rotate).then((_image) => {
      this._image = _image;

      const { width, height } = this.options;

      const imageWidth = _image.width;
      const imageHeight = _image.height;

      // 按比例渲染图片
      let renderHeight = imageHeight * (width / imageWidth);
      let renderWidth = width;
      let offsetX = 0;
      let offsetY = (height - renderHeight) / 2;

      if (imageHeight > imageWidth) {
        renderHeight = height;
        renderWidth = imageWidth * (height / imageHeight);
        offsetX = (width - renderWidth) / 2;
        offsetY = 0;
      }

      this._renderWidth = renderWidth;
      this._renderHeight = renderHeight;
      // 初始缩放比例根据图片宽度计算
      this._initialCoordinate = {
        x: offsetX,
        y: offsetY,
      };
      this._initialScale = renderWidth / imageWidth;

      axis!.initialBackgroundOffset = {
        x: offsetX,
        y: offsetY,
      };

      axis!.initialBackgroundScale = this._initialScale;
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
    this.loadImage(this._imageUrl!, { ...this.options, rotate: deg });
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

    const { ctx } = this;

    if (!ctx) {
      return;
    }

    this.options[key] = value;
    const { contrast, saturation, brightness } = this.options;
    ctx.filter = `brightness(${brightness! + 100}%) contrast(${contrast! + 100}%) saturate(${saturation! + 100}%)`;
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

  render() {
    const { ctx, _initialCoordinate, _renderWidth, _renderHeight } = this;

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
      maxX: coord.x + _renderWidth * scale,
      maxY: coord.y + _renderHeight * scale,
    };

    // 更新图片区域
    axis!.setSafeZone(bbox);

    ctx.save();

    ctx.drawImage(this._image, coord.x, coord.y, _renderWidth * scale, _renderHeight * scale);
    ctx.restore();

    return this;
  }
}
