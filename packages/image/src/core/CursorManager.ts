import type { AxisPoint, CursorStyle } from '@/shapes';
import { CrossCursor } from '@/shapes';

export class CursorManager {
  public cursor: CrossCursor | null = null;

  public enabled = true;

  private _container: HTMLDivElement | null = null;

  private _cursors: Record<string, any> = {};

  private _originCursor: string = 'auto';

  constructor(container: HTMLDivElement | null, coordinate: AxisPoint, style?: CursorStyle) {
    this.cursor = new CrossCursor({ x: coordinate.x, y: coordinate.y, style });
    this._container = container;
    this.enable();
  }

  public enable() {
    if (this._container) {
      this.enabled = true;
      this._container.style.cursor = 'none';
    }
  }

  public disable() {
    if (this._container) {
      this.enabled = false;
      this._container.style.cursor = this._originCursor;
    }
  }

  public register(name: string, cursor: CrossCursor) {
    if (this._cursors[name]) {
      console.warn(`Cursor ${name} has been registered`);
    }

    this._cursors[name] = cursor;
  }

  public unregister(name: string) {
    delete this._cursors[name];
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!this.enabled) {
      return;
    }

    if (this.cursor) {
      this.cursor.render(ctx);
    }
  }

  public move(x: number, y: number) {
    if (this.cursor) {
      this.cursor.updateCoordinate(x, y);
    }
  }
}
