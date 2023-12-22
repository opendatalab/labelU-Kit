import type { BBox } from 'rbush';

import type { AxisPoint } from '../shapes/Point.shape';
import { Cursor } from '../shapes/Cursor.shape';
import type { CursorParams } from '../shapes/Cursor.shape';
import { Ticker } from './Ticker';
import { EInternalEvent } from '../enums';
import * as eventEmitter from '../singletons/eventEmitter';
import { monitor, rbush } from '../singletons';
import type { Renderer } from './Renderer';

const SCALE_FACTOR = 1.1;

export interface AxisParams {
  /**
   * 画布元素
   */
  renderer: Renderer;

  cursor?: CursorParams | false;
}

/**
 * 画布坐标系 Axis，用于管理画布的移动、缩放等操作
 */
export class Axis {
  static MIN_SCALE = 0.1;

  static MAX_SCALE = 20;

  /** 画布相对左上角原点偏移的 x 距离 */
  private _x: number = 0;

  /** 画布相对左上角原点偏移的 y 距离 */
  private _y: number = 0;

  /** 缩放比例 */
  private _scale: number = 1;

  /**
   * 移动画布时的起始点
   */
  private _startPanPoint: AxisPoint | null = null;

  private _safeZone: BBox = {
    minX: -Infinity,
    minY: -Infinity,
    maxX: Infinity,
    maxY: Infinity,
  };

  /**
   * 左键点击的起始点
   */
  private _startMovePoint: AxisPoint | null = null;

  private _distanceX: number = 0;

  private _distanceY: number = 0;

  private _cursor: Cursor | null = null;

  private _renderer: Renderer | null = null;

  private _ticker: Ticker | null = null;

  /**
   * 以鼠标为中心缩放时的坐标
   */
  private _scaleCenter: AxisPoint = {
    x: 0,
    y: 0,
  };

  private _initialBackgroundOffset: AxisPoint = {
    x: 0,
    y: 0,
  };

  private _initialBackgroundScale: number = 1;

  public set initialBackgroundScale(scale: number) {
    this._initialBackgroundScale = scale;
  }

  public get initialBackgroundScale() {
    return this._initialBackgroundScale;
  }

  public set initialBackgroundOffset(offset: AxisPoint) {
    this._initialBackgroundOffset = offset;
  }

  public get initialBackgroundOffset() {
    return this._initialBackgroundOffset;
  }

  constructor({ renderer, cursor }: AxisParams) {
    this._createTicker();
    this._bindEvents();
    this._cursor = new Cursor({ x: 0, y: 0, ...cursor });
    this._renderer = renderer;
    // NOTE: debug
    this._renderRBushTree();
  }

  private _bindEvents() {
    /**
     * NOTE: 画布元素的事件监听都应该在这里绑定，而不是在分散具体的工具中绑定
     */
    eventEmitter.on(EInternalEvent.RightMouseDown, this._handleMoveStart);
    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.on(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
    eventEmitter.on(EInternalEvent.Wheel, this._handleScroll);
    eventEmitter.on(EInternalEvent.KeyUp, this._handleKeyUp);
  }

  private _offEvents() {
    eventEmitter.off(EInternalEvent.RightMouseDown, this._handleMoveStart);
    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
    eventEmitter.off(EInternalEvent.Wheel, this._handleScroll);
  }

  private _handleKeyUp = () => {
    const { _renderer } = this;

    _renderer!.canvas.style.cursor = 'none';
  };

  private _handleMoveStart = (e: MouseEvent) => {
    // 起始点：鼠标点击位置：在画布内的真实坐标
    this._startPanPoint = {
      x: e.offsetX - this._x,
      y: e.offsetY - this._y,
    };

    // 鼠标相对左上角位置
    this._startMovePoint = {
      x: e.offsetX,
      y: e.offsetY,
    };
  };

  private _handleLeftMouseDown = (e: MouseEvent) => {
    this._startMovePoint = {
      x: e.offsetX,
      y: e.offsetY,
    };

    console.log(monitor?.keyboard);

    if (monitor?.keyboard.Space) {
      this._startPanPoint = {
        x: e.offsetX - this._x,
        y: e.offsetY - this._y,
      };
    }
  };

  private _pan = (e: MouseEvent) => {
    const { _startPanPoint, _renderer, _startMovePoint } = this;
    const point = {
      x: e.offsetX,
      y: e.offsetY,
    };

    this._distanceX = point.x - _startMovePoint!.x;
    this._distanceY = point.y - _startMovePoint!.y;

    this._x = point.x - _startPanPoint!.x;
    this._y = point.y - _startPanPoint!.y;

    _renderer!.canvas.style.cursor = 'grabbing';

    eventEmitter.emit(EInternalEvent.AxisChange, e);
  };

  private _handleMouseMove = (e: MouseEvent) => {
    if (this._startPanPoint) {
      this._pan(e);

      // 移动画布时隐藏鼠标指针，移动时始终在图片外面
      this._cursor!.updateCoordinate(Math.min(-this._x - 1, -1), Math.min(-this._y - 1, -1));
    } else {
      this._calcMouseMove(e);
      eventEmitter.emit(EInternalEvent.MouseMoveWithoutAxisChange, e);
      this._cursor!.updateCoordinate(e.offsetX, e.offsetY);
    }

    // 只要鼠标在画布内移动，触发画布更新
    this._ticker?.requestUpdate();
  };

  private _calcMouseMove(e: MouseEvent) {
    const { _startMovePoint } = this;

    if (!_startMovePoint) {
      return;
    }

    const point = {
      x: e.offsetX,
      y: e.offsetY,
    };

    this._distanceX = point.x - _startMovePoint!.x;
    this._distanceY = point.y - _startMovePoint!.y;
  }

  private _handleLeftMouseUp = () => {
    // 内部可能有模块还在使用这些变量，所以延迟清空
    setTimeout(() => {
      this._startMovePoint = null;
      this._startPanPoint = null;

      this._distanceX = 0;
      this._distanceY = 0;
    });
  };

  private _handleRightMouseUp = (e: MouseEvent) => {
    const { _renderer } = this;

    _renderer!.canvas.style.cursor = 'none';

    this._startPanPoint = null;
    this._startMovePoint = null;

    if (!this.isMoved) {
      eventEmitter.emit(EInternalEvent.RightMouseUpWithoutAxisChange, e);
    } else {
      // 内部可能有模块还在使用这些变量，所以延迟清空
      setTimeout(() => {
        this._distanceX = 0;
        this._distanceY = 0;

        eventEmitter.emit(EInternalEvent.PanEnd, e);
      });
    }
  };

  private _handleScroll = (e: WheelEvent) => {
    // 当前鼠标所在画布屏幕上的坐标（不是在画布坐标系里面）
    const point = {
      x: e.offsetX,
      y: e.offsetY,
    };

    const scaleFactor = e.deltaY < 0 ? SCALE_FACTOR : 1 / SCALE_FACTOR;

    if (this._scale * scaleFactor < Axis.MIN_SCALE || this._scale * scaleFactor > Axis.MAX_SCALE) {
      return;
    }

    // 画布坐标原点距离画布左上角的新的偏移量
    const newX = point.x - (point.x - this._x) * scaleFactor;
    const newY = point.y - (point.y - this._y) * scaleFactor;

    this._scaleCenter = point;

    this._x = newX;
    this._y = newY;
    this._scale *= scaleFactor;

    this._ticker?.requestUpdate();

    eventEmitter.emit(EInternalEvent.Zoom, e);
    eventEmitter.emit(EInternalEvent.AxisChange, e);
  };

  /**
   * 根据图片的初始位置和缩放比例，计算在画布上的精确位置
   *
   * @description
   * 初始数据加载需要考虑图片的缩放和在画布中的位置。
   * 图片按比例在画布中居中显示，所以要考虑图片在画布中的偏移量和缩放比例。
   * 在加载数据时，数据的原始坐标是以原始图片左上角为原点的坐标；
   * 又因工具的数据结构并不都一致，所以需要各自的Tool中将原始坐标转换为画布中的坐标
   */
  public convertSourceCoordinate(coord: AxisPoint) {
    if (!('x' in coord) || !('y' in coord)) {
      throw new Error('Invalid coordinate');
    }

    const { _initialBackgroundOffset, _initialBackgroundScale } = this;

    return {
      x: coord.x * _initialBackgroundScale + _initialBackgroundOffset.x,
      y: coord.y * _initialBackgroundScale + _initialBackgroundOffset.y,
    };
  }

  /**
   * 由画布上的坐标转换为以原始图片左上角为原点的坐标
   *
   * @param coord 画布上的坐标
   */
  public convertCanvasCoordinate(coord: AxisPoint) {
    if (!('x' in coord) || !('y' in coord)) {
      throw new Error('Invalid coordinate');
    }

    return {
      x: this.convertCanvasCoordinateX(coord.x),
      y: this.convertCanvasCoordinateY(coord.y),
    };
  }

  public convertCanvasCoordinateX(x: number) {
    if (typeof x !== 'number') {
      throw new Error('Invalid x');
    }

    const { _initialBackgroundOffset, _initialBackgroundScale } = this;

    return (x - _initialBackgroundOffset.x) / _initialBackgroundScale;
  }

  public convertCanvasCoordinateY(y: number) {
    if (typeof y !== 'number') {
      throw new Error('Invalid y');
    }

    const { _initialBackgroundOffset, _initialBackgroundScale } = this;

    return (y - _initialBackgroundOffset.y) / _initialBackgroundScale;
  }

  public rerender() {
    const { _cursor, _renderer } = this;

    eventEmitter.emit(EInternalEvent.Render, _renderer!.ctx);
    // 光标需要在最上层
    Promise.resolve().then(() => _cursor!.render(_renderer!.ctx));
    // debug
    this._renderRBushTree();
  }

  /**
   * Debug使用，渲染R-Tree
   */
  private _renderRBushTree() {
    const { ctx } = this._renderer!;

    ctx!.save();
    ctx!.strokeStyle = '#666';
    ctx!.globalAlpha = 1;
    ctx!.lineDashOffset = 2;
    ctx!.setLineDash([2, 2]);
    ctx!.lineWidth = 1;

    console.info(rbush.all().length);
    rbush.all().forEach((item) => {
      const { minX, minY, maxX, maxY } = item;

      ctx!.strokeRect(minX, minY, maxX - minX, maxY - minY);
    });

    ctx!.globalAlpha = 1;
    ctx!.restore();
  }

  /**
   * 创建更新器
   * @returns
   */
  private _createTicker() {
    this._ticker = new Ticker(() => {
      this.rerender();
    });

    this._ticker.start();
  }

  /**
   * 设置画笔的边界区域，超出区域不可绘制
   */
  public setSafeZone(bbox: BBox) {
    if (bbox.minX > bbox.maxX || bbox.minY > bbox.maxY) {
      throw new Error('Invalid bbox');
    }

    if (!bbox) {
      throw new Error('bbox is required');
    }

    if ('minX' in bbox && 'minY' in bbox && 'maxX' in bbox && 'maxY' in bbox) {
      this._safeZone = bbox;
    }
  }

  public isPointSafe(point: AxisPoint) {
    if (!point) {
      throw new Error('point is required');
    }

    if (!('x' in point) && !('y' in point)) {
      throw new Error('Invalid point');
    }

    return this.isSafeX(point.x) && this.isSafeY(point.y);
  }

  public isSafeX(x: number) {
    if (typeof +x !== 'number') {
      throw new Error('Invalid x');
    }

    const { minX, maxX } = this._safeZone;

    return x >= minX && x <= maxX;
  }

  public isSafeY(y: number) {
    if (typeof +y !== 'number') {
      throw new Error('Invalid y');
    }

    const { minY, maxY } = this._safeZone;

    return y >= minY && y <= maxY;
  }

  public getSafeCoordinate(point: AxisPoint) {
    if (!point) {
      throw new Error('point is required');
    }

    if (!('x' in point) && !('y' in point)) {
      throw new Error('Invalid point');
    }

    return {
      x: this.getSafeX(point.x),
      y: this.getSafeY(point.y),
    };
  }

  public getSafeX(x: number) {
    if (typeof x !== 'number') {
      throw new Error('Invalid x');
    }

    const { minX, maxX } = this._safeZone;

    return Math.min(Math.max(x, minX), maxX);
  }

  public getSafeY(y: number) {
    if (typeof y !== 'number') {
      throw new Error('Invalid y');
    }

    const { minY, maxY } = this._safeZone;

    return Math.min(Math.max(y, minY), maxY);
  }

  public get safeZone() {
    return this._safeZone;
  }

  public get scale() {
    return this._scale;
  }

  public get offset() {
    return {
      x: this._x,
      y: this._y,
    };
  }

  public get distance() {
    return {
      x: this._distanceX,
      y: this._distanceY,
    };
  }

  public get isMoved() {
    return this._distanceX !== 0 || this._distanceY !== 0;
  }

  public get cursor() {
    return this._cursor;
  }

  /**
   * 获取缩放后的坐标
   *
   * @description
   *
   * 以线段为例，首先定义以下变量：
   * (x1, y1) 和 (x2, y2)：线段的起点和终点坐标
   * (cx, cy)：缩放中心点的坐标
   * scale：缩放比例
   * _x 和 _y：偏移量
   *
   * new_x1 = _x + (cx + (x1 - cx) * scale)
   *                     └-----------------┘  ┐
   * new_y1 = _y + (cy + (y1 - cy) * scale)    → 是根据缩放中心(cx, cy)，将线段起点(x1,y1)进行缩放后的新坐标。
   *                     └-----------------┘  ┘
   * new_x2 = _x + (cx + (x2 - cx) * scale)
   *               └-----------------------┘  ┐
   * new_y2 = _y + (cy + (y2 - cy) * scale)    → 是将缩放后的坐标重新平移到原来的位置。因为初始的缩放是以(cx,cy)为原点，所以要加上cx和cy将缩放后的坐标平移到正确的位置。
   *               └-----------------------┘  ┘
   *         └----------------↓------------┘
   *         这是最终偏移量后的坐标。由于画布可能有一定的偏移量（_x 和 _y），所以需要把这个偏移量也考虑进去。
   *
   * @param originCoord 原始坐标
   * @returns 缩放后的坐标
   */
  public getScaledCoord(originCoord: AxisPoint): AxisPoint {
    const { x, y } = originCoord;

    return {
      x: this.getScaledX(x),
      y: this.getScaledY(y),
    };
  }

  public getOriginalCoord(scaledCoord: AxisPoint): AxisPoint {
    const { x, y } = scaledCoord;

    return {
      x: this.getOriginalX(x),
      y: this.getOriginalY(y),
    };
  }

  public getOriginalX(x: number) {
    const { _x, _scaleCenter, _scale } = this;

    return (x - _x) / _scale - _scaleCenter.x + _scaleCenter.x;
  }

  public getOriginalY(y: number) {
    const { _y, _scaleCenter, _scale } = this;

    return (y - _y) / _scale - _scaleCenter.y + _scaleCenter.y;
  }

  public getScaledX(x: number) {
    const { _x, _scaleCenter, _scale } = this;

    return _x + (_scaleCenter.x + (x - _scaleCenter.x)) * _scale;
  }

  public getScaledY(y: number) {
    const { _y, _scaleCenter, _scale } = this;

    return _y + (_scaleCenter.y + (y - _scaleCenter.y)) * _scale;
  }

  /** 判断坐标集合内坐标是否在安全区内 */
  public isCoordinatesSafe(coordinates: AxisPoint[] | AxisPoint[][]) {
    if (!Array.isArray(coordinates)) {
      throw new Error('Invalid coordinates');
    }

    let safeX: undefined | boolean;
    let safeY: undefined | boolean;

    // 保证x轴和y轴丝滑移动，x和y不互相影响
    for (let i = 0; i < coordinates.length; i++) {
      if (Array.isArray(coordinates[i])) {
        const result = this.isCoordinatesSafe(coordinates[i] as AxisPoint[]);

        safeX = safeX === false ? false : result[0];
        safeY = safeY === false ? false : result[1];

        continue;
      }

      const coordinate = coordinates[i] as AxisPoint;

      const dx = coordinate.x + this.distance.x;
      const dy = coordinate.y + this.distance.y;
      const startCoord = { x: dx, y: dy };

      safeX = safeX === false ? false : this.isSafeX(startCoord.x);
      safeY = safeY === false ? false : this.isSafeY(startCoord.y);

      // 如果已经确定某个方向不安全，则无需再检查其余形状
      if (safeX === false && safeY === false) {
        break;
      }
    }

    return [safeX, safeY];
  }

  public get renderer() {
    return this._renderer;
  }

  public destroy() {
    this._offEvents();
    this._ticker?.stop();
    this._ticker = null;
  }
}
