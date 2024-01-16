import EventEmitter from 'eventemitter3';

export interface RendererOptions {
  container: HTMLElement;
  width: number;
  height: number;
}

export class Renderer extends EventEmitter {
  protected ratio: number = 1;

  public options: RendererOptions;

  public canvas: HTMLCanvasElement = document.createElement('canvas');

  public ctx: CanvasRenderingContext2D | null = null;

  constructor(options: RendererOptions) {
    super();

    const { container } = options;

    this.options = options;
    this.ratio = window.devicePixelRatio || 1;
    this.ctx = this.canvas.getContext('2d');
    this.ctx!.imageSmoothingEnabled = false;

    if (container) {
      container.appendChild(this.canvas);

      this.canvas.width = (options.width || container.clientWidth) * this.ratio;
      this.canvas.height = (options.height || container.clientHeight) * this.ratio;

      // 解决canvas绘制模糊问题
      this.ctx?.translate(0.5, 0.5);
      this.ctx?.scale(this.ratio, this.ratio);
    }
  }

  public clear(x1?: number, y1?: number, x2?: number, y2?: number) {
    const { ctx, canvas } = this;

    if (!ctx) {
      return;
    }

    if (x1 && y1 && x2 && y2) {
      ctx.clearRect(x1, y1, x2, y2);
    } else {
      // 避免网页缩放后清空画布不完全
      ctx.clearRect(0, 0, canvas.width * 10, canvas.height * 10);
    }
  }

  public resize(width: number, height: number) {
    const { canvas } = this;

    canvas.width = width * this.ratio;
    canvas.height = height * this.ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    this.ctx?.scale(this.ratio, this.ratio);
  }

  public destroy() {
    this.clear();
    this.canvas.remove();
  }
}
