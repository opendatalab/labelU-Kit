import EventEmitter from 'eventemitter3';
import type { BBox } from 'rbush';

import type { RBushItem } from '../singletons/rbush';
import { rbush, eventEmitter, axis } from '../singletons';
import { EInternalEvent } from '../enums';
import type { AxisPoint } from './Point.shape';

type Coord = AxisPoint | AxisPoint[];
type CoordinateChangeHandler = () => void;

/**
 * 画布上的图形对象（基类）
 */
export class Shape<Style> {
  private _event = new EventEmitter();

  private _cachedRBush: RBushItem | null = null;

  public isMouseOver = false;

  private _onCoordinateChangeHandlers: CoordinateChangeHandler[] = [];

  /**
   * 动态坐标
   *
   * @description 经过缩放拖拽等操作后，图形对象的坐标会发生变化，但是这个变化不会影响到图形对象的原始坐标
   */
  private _dynamicCoordinate: AxisPoint[] = [];

  /**
   * 图形对象的唯一标识
   */
  public id: string = '';

  /**
   * 图形对象的包围盒
   */
  public bbox: BBox = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  };

  /**
   * 图形对象原始的坐标
   */
  private _coordinate: AxisPoint[];

  private _outCount = 0;

  /**
   * 样式
   */
  public style: Style = {} as Style;

  /**
   * @param id 图形对象的唯一标识
   * @param coordinate 图形对象的原始坐标，不随缩放拖拽等操作而改变
   */
  constructor(id: string, coordinate: Coord) {
    this.id = id;

    if (!coordinate) {
      throw Error('coordinate is not a valid AxisPoint!');
    }
    this._coordinate = new Proxy(!Array.isArray(coordinate) ? [coordinate] : coordinate, this._coordinateHandler);

    this._bindEvents();
    this.onCoordinateChange(this._updateBBox.bind(this));
    this.onCoordinateChange(this._updateRBush.bind(this));
    this.update();
  }

  /**
   * 更新坐标后自动更新偏移后的坐标及bbox
   */
  protected _coordinateHandler: ProxyHandler<AxisPoint[]> = {
    get: (target: AxisPoint[], key: PropertyKey) => {
      if (!isNaN(Number(key))) {
        return new Proxy(target[Number(key)], this._coordinateItemHandler);
      } else {
        // @ts-ignore
        return target[key];
      }
    },
    set: (target, key, value) => {
      target[Number(key)] = value;
      this.update();
      return true;
    },
  };

  protected _coordinateItemHandler: ProxyHandler<AxisPoint> = {
    set: (target, key, value) => {
      if (key !== 'x' && key !== 'y') {
        throw Error('key must be x or y!');
      }

      target[key as 'x' | 'y'] = value;
      this.update();
      return true;
    },
  };

  private _bindEvents() {
    eventEmitter.on(EInternalEvent.AxisChange, this.update);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this.update);
  }

  private _syncCoordinateToDynamic() {
    const { _coordinate } = this;

    const newCoordinate = _coordinate.map((point) => {
      return axis!.getScaledCoord(point);
    });

    this._dynamicCoordinate = newCoordinate;
  }

  private _updateBBox() {
    const { _dynamicCoordinate } = this;

    if (!_dynamicCoordinate) {
      throw Error('dynamicCoordinate is not defined!');
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of _dynamicCoordinate) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    this.bbox = {
      minX,
      minY,
      maxX,
      maxY,
    };
  }

  private _updateRBush() {
    const { _cachedRBush, bbox } = this;

    if (_cachedRBush) {
      rbush.remove(_cachedRBush);

      _cachedRBush.minX = bbox.minX;
      _cachedRBush.minY = bbox.minY;
      _cachedRBush.maxX = bbox.maxX;
      _cachedRBush.maxY = bbox.maxY;

      rbush.insert(_cachedRBush!);
    } else {
      this._cachedRBush = {
        minX: bbox.minX,
        minY: bbox.minY,
        maxX: bbox.maxX,
        maxY: bbox.maxY,
        id: this.id,
        _shape: this,
      };
      rbush.insert(this._cachedRBush!);
    }
  }

  public set coordinate(coordinate: AxisPoint[]) {
    if (Array.isArray(coordinate)) {
      this._coordinate = new Proxy(coordinate, this._coordinateHandler);

      this.update();
    } else {
      throw new Error('coordinate must be an array of AxisPoint!');
    }
  }

  public get coordinate() {
    return this._coordinate;
  }

  public get plainCoordinate() {
    return this._coordinate.map((point) => {
      return {
        x: point.x,
        y: point.y,
      };
    });
  }

  public get dynamicCoordinate() {
    return this._dynamicCoordinate;
  }

  /**
   * 坐标变化时触发
   * @param handler 坐标变化时的回调函数
   * @returns 取消监听函数
   */
  public onCoordinateChange(handler: CoordinateChangeHandler) {
    this._onCoordinateChangeHandlers.push(handler);

    // 添加监听后立即执行更新
    this.update();

    return () => {
      const index = this._onCoordinateChangeHandlers.indexOf(handler);

      if (index !== -1) {
        this._onCoordinateChangeHandlers.splice(index, 1);
      }
    };
  }

  public update = () => {
    this._syncCoordinateToDynamic();

    for (const handler of this._onCoordinateChangeHandlers) {
      handler();
    }
  };

  public isUnderCursor(_mouseCoord: AxisPoint, _fromGroup?: boolean) {
    console.error('isUnderCursor is not implemented!');

    return false;
  }

  /**
   * 渲染图形
   * @param ctx canvas context
   */
  public render(ctx: CanvasRenderingContext2D | null): void;
  public render() {
    console.warn('render is not implemented!');
  }

  public destroy() {
    rbush.remove(this._cachedRBush!);
    this._event.removeAllListeners();
    eventEmitter.off(EInternalEvent.AxisChange, this.update);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this.update);
  }

  public updateStyle(style: Style) {
    this.style = { ...this.style, ...style };
  }

  // ================= 增加event代理 =================
  public on(eventName: EInternalEvent, listener: (...args: any[]) => void) {
    if (eventName === EInternalEvent.ShapeOver) {
      const handler = (...args: any[]) => {
        this.isMouseOver = true;
        this._outCount = this._event.listenerCount(EInternalEvent.ShapeOut);
        listener(...args);
      };

      return this._event.on(eventName, handler);
    }

    if (eventName === EInternalEvent.ShapeOut) {
      const handler = (...args: any[]) => {
        if (this.isMouseOver) {
          this._outCount--;

          // 当所有监听器都触发过一次后，才认为鼠标已经移出
          if (this._outCount === 0) {
            this.isMouseOver = false;
          }

          listener(...args);
        }
      };

      return this._event.on(eventName, handler);
    }

    return this._event.on(eventName, listener);
  }

  public once(eventName: EInternalEvent, listener: (...args: any[]) => void) {
    return this._event.once(eventName, listener);
  }

  public off(eventName: EInternalEvent, listener: (...args: any[]) => void) {
    return this._event.off(eventName, listener);
  }

  public emit(eventName: EInternalEvent, ...args: any[]) {
    return this._event.emit(eventName, ...args);
  }

  public removeAllListeners = this._event.removeAllListeners.bind(this._event);
}
