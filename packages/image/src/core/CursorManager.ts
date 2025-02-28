import type { AxisPoint } from '@/shapes';
import { CrossCursor, Cursor } from '@/shapes';

import { DEFAULT_LABEL_COLOR } from '../constant';

export type CursorType =
  | 'default'
  | 'grab'
  | 'grabbing'
  | 'move'
  | 'not-allowed'
  | 'n-resize'
  | 'e-resize'
  | 's-resize'
  | 'w-resize'
  | 'ne-resize'
  | 'nw-resize'
  | 'se-resize'
  | 'sw-resize'
  | 'ew-resize'
  | 'ns-resize'
  | 'nesw-resize'
  | 'nwse-resize'
  | 'disabled';

export class CursorManager {
  public currentCursor: CursorType = 'default';

  public disabled = false;

  private _container: HTMLDivElement;

  private _cursors: Partial<Record<CursorType, any>> = {
    default: new CrossCursor({
      x: 0,
      y: 0,
      style: {
        stroke: DEFAULT_LABEL_COLOR,
      },
    }),
  };

  private _coordinate: AxisPoint;

  private _color: string = DEFAULT_LABEL_COLOR;

  constructor(container: HTMLDivElement | null, coordinate: AxisPoint, color?: string) {
    if (!container) {
      throw new Error('Container is required');
    }

    this._coordinate = coordinate;
    this._container = container;
    this._color = color || this._color;
    this.activate();
  }

  public set color(color: string) {
    this._color = color;
    this.cursor?.setStyle({
      stroke: color,
    });
  }

  public get color() {
    return this._color;
  }

  /**
   * 激活到绘制鼠标
   */
  public activate() {
    this._container.style.cursor = 'none';
    this.currentCursor = 'default';

    this.cursor?.updateCoordinate(this._coordinate.x, this._coordinate.y);
    this.cursor?.setStyle({
      stroke: this._color,
    });
  }

  public enable() {
    this.disabled = false;
    this.activate();
  }

  public disable() {
    this.disabled = true;
    this.currentCursor = 'disabled';

    if (!this.cursor) {
      this._container.style.cursor = 'default';
    }
  }

  public register(name: CursorType, cursor: Cursor) {
    if (!(cursor instanceof Cursor)) {
      throw new Error('Cursor must be an instance of Cursor shape');
    }

    if (this._cursors[name]) {
      console.warn(`Cursor ${name} has been registered`);
    }

    this._cursors[name] = cursor;
  }

  public grab() {
    this.currentCursor = 'grab';

    if (!this.cursor) {
      this._container.style.cursor = 'grab';
    }
  }

  public invokeCursor(name: CursorType) {
    this.currentCursor = name;

    if (!this.cursor) {
      this._container.style.cursor = name === 'disabled' ? 'default' : name;
    }
  }

  public unregister(name: CursorType) {
    delete this._cursors[name];
  }

  public get cursor() {
    return this._cursors[this.currentCursor];
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!this.cursor || this.disabled) {
      return;
    }

    this.cursor.render(ctx);
  }

  public moveCursor(x: number, y: number) {
    this._coordinate = { x, y };

    if (this.cursor) {
      this.cursor.updateCoordinate(x, y);
    }
  }
}
