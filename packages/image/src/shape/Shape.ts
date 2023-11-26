import EventEmitter from 'eventemitter3';
import type { BBox } from 'rbush';

import type { RBushItem } from '../singletons/rbush';
import { rbush, eventEmitter, axis } from '../singletons';
import { EInternalEvent } from '../enums';
import type { AxisPoint } from './Point.shape';

type Coord = AxisPoint | AxisPoint[];

export interface AxisChangeCallbacks {
  /**
   * 更新坐标
   */
  updateCoordinate?: () => AxisPoint[];

  /**
   * 更新包围盒
   */
  updateBBox?: (dynamicCoordinate: AxisPoint[]) => BBox;
}

/**
 * 画布上的图形对象（基类）
 */
export class Shape<Style> {
  private _event = new EventEmitter();

  private _cachedRBush: RBushItem | null = null;

  private _coordinateUpdater?: () => AxisPoint[];

  private _bboxUpdater?: (dynamicCoordinate: AxisPoint[]) => BBox;

  /**
   * 动态坐标
   *
   * @description 经过缩放拖拽等操作后，图形对象的坐标会发生变化，但是这个变化不会影响到图形对象的原始坐标
   */
  public dynamicCoordinate: AxisPoint[];

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
  public coordinate: AxisPoint[];

  /**
   * 样式
   */
  public style: Style = {} as Style;

  /**
   * @param id 图形对象的唯一标识
   * @param coordinate 图形对象的原始坐标，不随缩放拖拽等操作而改变
   */
  constructor(id: string, coordinate: Coord, callbacks?: AxisChangeCallbacks) {
    this.id = id;

    if (!coordinate) {
      throw Error('coordinate is not a valid AxisPoint!');
    }

    this._coordinateUpdater = callbacks?.updateCoordinate;
    this._bboxUpdater = callbacks?.updateBBox;
    this.coordinate = !Array.isArray(coordinate) ? [coordinate] : coordinate;
    this.dynamicCoordinate = this.coordinate;

    this._bindEvents();
    this._update();
  }

  private _bindEvents() {
    eventEmitter.on(EInternalEvent.AxisChange, this._update.bind(this));
  }

  private _update() {
    this._updateDynamicCoordinate();
    this._updateBBox();
    this._updateRBush();
  }

  private _updateBBox() {
    const { dynamicCoordinate, _bboxUpdater } = this;

    if (!dynamicCoordinate) {
      throw Error('dynamicCoordinate is not defined!');
    }

    let bbox = _bboxUpdater?.(dynamicCoordinate);

    if (!bbox) {
      // 使用默认的bbox更新器

      bbox = {
        minX: Math.min(...dynamicCoordinate.map((point) => point.x)),
        minY: Math.min(...dynamicCoordinate.map((point) => point.y)),
        maxX: Math.max(...dynamicCoordinate.map((point) => point.x)),
        maxY: Math.max(...dynamicCoordinate.map((point) => point.y)),
      };
    }

    this.bbox = bbox;
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
      };
      rbush.insert(this._cachedRBush!);
    }
  }

  private _updateDynamicCoordinate() {
    const { coordinate, _coordinateUpdater } = this;
    let newCoordinate = _coordinateUpdater?.();

    if (!newCoordinate) {
      // 使用默认的坐标更新器

      newCoordinate = coordinate.map((point) => {
        return axis!.getScaledCoord(point);
      });
    }

    this.dynamicCoordinate = newCoordinate;
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
    eventEmitter.off(EInternalEvent.AxisChange, this._updateRBush.bind(this));
  }

  public updateStyle(style: Partial<Style>) {
    this.style = { ...this.style, ...style };
  }

  // ================= 增加event代理 =================
  public on(eventName: EInternalEvent, listener: (...args: any[]) => void) {
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
