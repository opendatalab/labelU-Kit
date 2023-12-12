import type { RendererOptions } from './Renderer';
import { Renderer } from './Renderer';
import { axis } from '../singletons';
import type { AxisPoint } from '../shapes';

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
   * @default 1
   */
  contrast?: number;

  /**
   * 饱和度
   *
   * @default 1
   */
  saturation?: number;

  /**
   * 曝光度
   *
   * @default 1
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

  public options: ImageOption = {
    rotate: 0,
    contrast: 1,
    saturation: 1,
    brightness: 1,
    width: 0,
    height: 0,
  } as ImageOption;

  constructor(options: ImageOption) {
    super(options);

    this.options = options;
  }

  /**
   * 渲染图片，只渲染一张图片（多次调用会清除先前的渲染）
   * @param url 图片URL
   * @returns this
   */
  public loadImage(url: string | undefined, options: Omit<ImageOption, 'url'> | undefined): Promise<this> {
    const { ctx } = this;

    if (url) {
      this.options.url = url;
    }

    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    const { url: imageUrl } = this.options;

    if (!ctx) {
      return Promise.resolve(this);
    }

    if (!imageUrl) {
      throw new Error('image url is required');
    }

    return new Promise((resolve, reject) => {
      const _image = new Image();
      _image.src = imageUrl;
      _image.onload = () => {
        this._image = _image;

        const { width, height } = this.options;

        const imageWidth = _image.width;
        const imageHeight = _image.height;

        // 按比例渲染图片
        let renderHeight = imageHeight * (width / imageWidth);
        let renderWidth = width;
        let offsetX = 0;
        const offsetY = (height - renderHeight) / 2;

        if (imageHeight > imageWidth) {
          renderHeight = height;
          renderWidth = imageWidth * (height / imageHeight);
          offsetX = (width - renderWidth) / 2;
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

        resolve(this);
      };

      _image.onerror = (err) => {
        this.emit('error', err);
        reject(err);
      };
    });
  }

  public get image() {
    return this._image;
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

    ctx.drawImage(this._image, coord.x, coord.y, _renderWidth * scale, _renderHeight * scale);

    return this;
  }
}
