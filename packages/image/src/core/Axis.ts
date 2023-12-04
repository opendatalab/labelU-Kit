import type { AxisPoint } from '../shape/Point.shape';
import { Cursor } from '../shape/Cursor.shape';
import { Ticker } from './Ticker';
import type { Annotator } from '../ImageAnnotator';
import { EInternalEvent } from '../enums';
import * as eventEmitter from '../singletons/eventEmitter';
import { rbush } from '../singletons';

const SCALE_FACTOR = 1.1;

/**
 * 画布坐标系 Axis，用于管理画布的移动、缩放等操作
 */
export class Axis {
  static MIN_SCALE = 0.1;

  static MAX_SCALE = 20;

  private _annotator: Annotator | null = null;

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

  /**
   * 左键点击的起始点
   */
  private _startMovePoint: AxisPoint | null = null;

  private _distanceX: number = 0;

  private _distanceY: number = 0;

  private _cursor: Cursor | null = null;

  private _ticker: Ticker | null = null;

  /**
   * 以鼠标为中心缩放时的坐标
   */
  private _scaleCenter: AxisPoint = {
    x: 0,
    y: 0,
  };

  constructor(annotator: Annotator) {
    const { cursor } = annotator!.config;

    // TODO：改成renderer参数
    this._annotator = annotator;

    this._createTicker();
    this._bindEvents();
    this._cursor = new Cursor({ x: 0, y: 0, ...cursor });
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
  }

  private _offEvents() {
    eventEmitter.off(EInternalEvent.RightMouseDown, this._handleMoveStart);
    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleLeftMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleLeftMouseUp);
    eventEmitter.off(EInternalEvent.RightMouseUp, this._handleRightMouseUp);
    eventEmitter.off(EInternalEvent.Wheel, this._handleScroll);
  }

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
  };

  private _pan = (e: MouseEvent) => {
    const { _startPanPoint, _annotator, _startMovePoint } = this;
    const point = {
      x: e.offsetX,
      y: e.offsetY,
    };

    this._distanceX = point.x - _startMovePoint!.x;
    this._distanceY = point.y - _startMovePoint!.y;

    this._x = point.x - _startPanPoint!.x;
    this._y = point.y - _startPanPoint!.y;

    _annotator!.renderer!.canvas.style.cursor = 'grabbing';

    eventEmitter.emit(EInternalEvent.AxisChange, e);
  };

  private _handleMouseMove = (e: MouseEvent) => {
    if (this._startPanPoint) {
      this._pan(e);
      // 移动画布时隐藏鼠标指针，移动时始终在画布外面
      this._cursor!.updateCoordinate(Math.min(-this._x - 1, -1), Math.min(-this._y - 1, -1));
    } else {
      this._calcMouseMove(e);
      this._cursor!.updateCoordinate(e.offsetX, e.offsetY);
      eventEmitter.emit(EInternalEvent.MouseMoveWithoutAxisChange, e);
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

      this._distanceX = 0;
      this._distanceY = 0;
    });
  };

  private _handleRightMouseUp = (e: MouseEvent) => {
    const { _annotator, _distanceX, _distanceY } = this;

    _annotator!.renderer!.canvas.style.cursor = 'none';

    const isMoved = _distanceX !== 0 || _distanceY !== 0;

    this._startPanPoint = null;
    this._startMovePoint = null;

    if (!isMoved) {
      eventEmitter.emit(EInternalEvent.RightMouseUpWithoutAxisChange, e);
    } else {
      this._distanceX = 0;
      this._distanceY = 0;

      eventEmitter.emit(EInternalEvent.PanEnd, e);
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

  public rerender() {
    const { _cursor, _annotator } = this;
    const { renderer } = _annotator!;

    eventEmitter.emit(EInternalEvent.Render, renderer!.ctx);
    _cursor!.render(renderer!.ctx);
    // debug
    this._renderRBushTree();
  }

  /**
   * Debug使用，渲染R-Tree
   */
  private _renderRBushTree() {
    const { ctx } = this._annotator!.renderer!;

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

  public destroy() {
    this._offEvents();
    this._ticker?.stop();
    this._ticker = null;
  }
}
