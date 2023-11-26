import type { RendererOptions } from './Renderer';
import { Renderer } from './Renderer';
import { axis } from '../singletons';

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
        this.render();

        resolve(this);
      };

      _image.onerror = (err) => {
        this.emit('error', err);
        reject(err);
      };
    });
  }

  render() {
    const { ctx } = this;

    if (!ctx) {
      return;
    }

    if (!this._image) {
      return;
    }

    const { width, height } = this.options;

    const _width = this._image?.width || 0;
    const _height = this._image?.height || 0;

    // 按比例渲染图片
    let renderHeight = _height * (width / _width);
    let renderWidth = width;
    let offsetX = 0;
    const offsetY = (height - renderHeight) / 2;

    if (_height > _width) {
      renderHeight = height;
      renderWidth = _width * (height / _height);
      offsetX = (width - renderWidth) / 2;
    }

    const { scale } = axis!;

    const coord = axis!.getScaledCoord({
      x: offsetX,
      y: offsetY,
    });

    ctx.drawImage(this._image, coord.x, coord.y, renderWidth * scale, renderHeight * scale);

    return this;
  }
}
