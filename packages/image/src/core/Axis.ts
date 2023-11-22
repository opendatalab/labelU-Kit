import EventEmitter from 'eventemitter3';

import type { AxisPoint } from '../tools/Point';
import type { CursorParams } from '../graphics/Cursor';
import { Cursor } from '../graphics/Cursor';
import { Ticker } from './Ticker';
import type { Annotator } from '../ImageAnnotator';

const SCALE_FACTOR = 1.1;

interface AxisParams {
  container: HTMLDivElement;
  cursor?: CursorParams | false;
}

function ValidateAnnotator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const _this = this as Axis;

    if (!_this.annotator) {
      throw new Error('Error: annotator is not defined.');
    }

    return originalMethod.apply(this, args);
  };
}

/**
 * 坐标 Axis，用于管理画布的移动、缩放等操作
 */
export class Axis extends EventEmitter {
  private _isMoving: boolean = false;

  private _annotator: Annotator | null = null;

  private _params: AxisParams | null = null;

  /** 画布相对左上角原点偏移的 x 距离 */
  private _x: number = 0;

  /** 画布相对左上角原点偏移的 y 距离 */
  private _y: number = 0;

  private _rect: DOMRect | null = null;

  private _scale: number = 1;

  private _startPoint: AxisPoint | null = null;

  private _distanceX: number = 0;

  private _distanceY: number = 0;

  private _cursor: Cursor | null = null;

  private _ticker: Ticker | null = null;

  private _scalePoint: AxisPoint = {
    x: 0,
    y: 0,
  };

  constructor(params?: AxisParams) {
    super();

    this._cursor = new Cursor({ x: 0, y: 0, ...params!.cursor });
    this._params = params!;
  }

  private _bindEvents() {
    const { container } = this._params!;

    container.addEventListener('contextmenu', this._handleMoveStart.bind(this), false);
    container.addEventListener('mousemove', this._handleMoving.bind(this), false);
    container.addEventListener('mouseup', this._handleMoveEnd.bind(this), false);
    container.addEventListener('wheel', this._handleScroll.bind(this), false);
  }

  private _offEvents() {
    const { container } = this._params!;

    container.removeEventListener('contextmenu', this._handleMoveStart.bind(this));
    container.removeEventListener('mousemove', this._handleMoving.bind(this));
    container.removeEventListener('mouseup', this._handleMoveEnd.bind(this));
    container.removeEventListener('wheel', this._handleScroll.bind(this));
  }

  @ValidateAnnotator
  private _handleMoveStart(e: MouseEvent) {
    e.preventDefault();
    const { container } = this._params!;

    if (!container) {
      return;
    }

    this._isMoving = false;

    // 起始点：鼠标点击位置：在画布内的真实坐标
    this._startPoint = this._getCursorCoordInCanvas(e);

    this.emit('move-start', this);
  }

  @ValidateAnnotator
  private _pan(e: MouseEvent) {
    const { _startPoint, _annotator } = this;
    const point = this._getCursorCoordInCanvas(e);

    this._x = this._x + point.x - _startPoint!.x;
    this._y = this._y + point.y - _startPoint!.y;

    _annotator!.renderer!.canvas.style.cursor = 'grabbing';
    this._isMoving = true;

    this.emit('move', this);
  }

  private _handleMoving(e: MouseEvent) {
    e.preventDefault();

    if (this._startPoint) {
      this._pan(e);
      // 移动画布时隐藏鼠标指针，移动时始终在画布外面
      this._cursor!.updateCoordinate(Math.min(-this._x - 1, -1), Math.min(-this._y - 1, -1));
    } else {
      this._cursor!.updateCoordinate(e.offsetX, e.offsetY);
    }

    this._ticker?.requestUpdate();
  }

  @ValidateAnnotator
  private _handleMoveEnd(e: MouseEvent) {
    e.preventDefault();
    const { _annotator } = this;

    _annotator!.renderer!.canvas.style.cursor = 'none';

    this._x = this._x + this._distanceX;
    this._y = this._y + this._distanceY;
    this._startPoint = null;
    this._isMoving = false;
    this.emit('move-end', this);
  }

  private _handleScroll(e: WheelEvent) {
    e.preventDefault();

    const point = this.getCoordRelativeToCanvas(e as MouseEvent);

    // Calculate the new scale factor
    const scaleFactor = e.deltaY < 0 ? SCALE_FACTOR : 1 / SCALE_FACTOR;

    // Calculate the new x and y to make the zoom centered around the mouse position
    const newX = point.x - (point.x - this._x) * scaleFactor;
    const newY = point.y - (point.y - this._y) * scaleFactor;

    this._scalePoint = point;

    console.log(point);

    // Update x, y and scale
    this._x = newX;
    this._y = newY;
    this._scale *= scaleFactor;

    // Schedule a rerender
    this._ticker?.requestUpdate();

    // Emit 'zoom' event
    this.emit('zoom', this);
  }

  @ValidateAnnotator
  private getCoordRelativeToCanvas(e: MouseEvent) {
    const { _rect } = this;

    return {
      x: e.clientX - _rect!.left,
      y: e.clientY - _rect!.top,
    };
  }

  private _getCursorCoordInCanvas(e: MouseEvent) {
    const { _rect, _x, _y } = this;

    return {
      x: e.clientX - _rect!.left - _x,
      y: e.clientY - _rect!.top - _y,
    };
  }

  private _getCoordInCanvas(p: AxisPoint) {
    if (!p) {
      throw new Error('Error: p is not defined.');
    }

    const { _x, _y } = this;

    return {
      x: p.x - _x,
      y: p.y - _y,
    };
  }

  @ValidateAnnotator
  private _rerender() {
    const { _cursor, _annotator } = this;
    const { renderer, backgroundRenderer } = _annotator!;

    renderer?.clear();
    backgroundRenderer?.clear();

    _annotator!.render();
    backgroundRenderer?.render();
    _cursor!.render(renderer!.ctx);
  }

  /**
   * 创建更新器
   * @returns
   */
  private _createTicker() {
    this._ticker = new Ticker(() => {
      this._rerender();
    });

    this._ticker.start();
  }

  public get scalePoint() {
    return this._scalePoint;
  }

  public get x() {
    return this._x;
  }

  public get y() {
    return this._y;
  }

  public get scale() {
    return this._scale;
  }

  public get isMoving() {
    return this._isMoving;
  }

  public get annotator() {
    return this._annotator;
  }

  /**
   * 获取缩放后的坐标
   *
   * @param originCoord 原始坐标
   * @returns 缩放后的坐标
   */
  public getScaledCoord(originCoord: AxisPoint): AxisPoint {
    const { x, y } = originCoord;
    const { _x, _y, _scalePoint, _scale } = this;

    return {
      x: _x + (_scalePoint.x + (x - _scalePoint.x)) * _scale,
      y: _y + (_scalePoint.y + (y - _scalePoint.y)) * _scale,
    };
  }

  public setup(annotator: Annotator) {
    this._annotator = annotator;
    this._rect = annotator.renderer!.canvas.getBoundingClientRect();

    this._createTicker();
    this._bindEvents();
  }

  public zoom() {
    this._ticker?.requestUpdate();
  }

  public destroy() {
    this._offEvents();
    this.removeAllListeners();
    this._ticker?.stop();
    this._ticker = null;
  }
}
