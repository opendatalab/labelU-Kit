import EventEmitter from 'eventemitter3';

export interface RendererOptions {
  container: HTMLElement;
  width: number;
  height: number;
}

export class Renderer extends EventEmitter {
  private _ratio: number = 1;
  public options: RendererOptions;

  public canvas: HTMLCanvasElement = document.createElement('canvas');

  public ctx: CanvasRenderingContext2D | null = null;

  constructor(options: RendererOptions) {
    super();

    const { container } = options;

    this.options = options;
    this._ratio = window.devicePixelRatio || 1;
    this.ctx = this.canvas.getContext('2d');

    if (container) {
      container.appendChild(this.canvas);

      this.canvas.width = options.width || container.clientWidth;
      this.canvas.height = options.height || container.clientHeight;
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
