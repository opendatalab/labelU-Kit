import EventEmitter from 'eventemitter3';
import type { BBox } from 'rbush';

import type { Shape } from './Shape';
import { EInternalEvent } from '../enums';
import type { RBushItem } from '../singletons';
import { eventEmitter, rbush } from '../singletons';

/**
 * 组合类，用于组合多个图形
 */
export class Group<T extends Shape<Style>, Style> {
  public id: string;

  /**
   * 图形组的包围盒
   */
  public bbox: BBox = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  };

  private _cachedRBush: RBushItem | null = null;

  private _shapeMapping: Map<string, T> = new Map();

  private _event = new EventEmitter();

  constructor(id: string) {
    this.id = id;

    this._bindEvents();
  }

  private _bindEvents() {
    // 组合的变化只需要在移动结束和缩放结束后更新
    eventEmitter.on(EInternalEvent.MoveEnd, this._OnAxisChange.bind(this));
    eventEmitter.on(EInternalEvent.Zoom, this._OnAxisChange.bind(this));
  }

  private _OnAxisChange() {
    // 组合在图形之后创建，所以需要延迟一帧更新
    setTimeout(() => {
      this._updateBBox()._updateRBush();
    });
  }

  private _updateBBox() {
    const minX = Math.min(...this.shapes.map((shape) => shape.bbox.minX));
    const minY = Math.min(...this.shapes.map((shape) => shape.bbox.minY));
    const maxX = Math.max(...this.shapes.map((shape) => shape.bbox.maxX));
    const maxY = Math.max(...this.shapes.map((shape) => shape.bbox.maxY));

    this.bbox = {
      minX,
      minY,
      maxX,
      maxY,
    };

    return this;
  }

  private _updateRBush() {
    const { _cachedRBush, bbox } = this;

    if (_cachedRBush) {
      rbush.remove(_cachedRBush);

      _cachedRBush.minX = bbox.minX;
      _cachedRBush.minY = bbox.minY;
      _cachedRBush.maxX = bbox.maxX;
      _cachedRBush.maxY = bbox.maxY;
    } else {
      this._cachedRBush = {
        minX: bbox.minX,
        minY: bbox.minY,
        maxX: bbox.maxX,
        maxY: bbox.maxY,
        id: this.id,
      };
    }

    rbush.insert(this._cachedRBush!);

    return this;
  }

  public updateStyle(style: Style) {
    this.shapes.forEach((shape) => {
      shape.updateStyle(style);
    });
  }

  public add(...shapes: T[]) {
    shapes.forEach((shape) => {
      this._shapeMapping.set(shape.id, shape);
    });

    this._updateBBox()._updateRBush();
  }

  public remove(...shapes: T[]) {
    shapes.forEach((shape) => {
      this._shapeMapping.delete(shape.id);
    });

    this._updateBBox()._updateRBush();
  }

  public each(callback: (shape: T) => void) {
    this.shapes.forEach((shape) => {
      callback(shape);
    });
  }

  public render(ctx: CanvasRenderingContext2D) {
    this.shapes.forEach((shape) => {
      shape.render(ctx);
    });
  }

  public destroy() {
    this.shapes.forEach((shape) => {
      shape.destroy();
    });

    this._shapeMapping.clear();
    eventEmitter.off(EInternalEvent.MoveEnd, this._OnAxisChange.bind(this));
    eventEmitter.off(EInternalEvent.Zoom, this._OnAxisChange.bind(this));
  }

  public get shapes() {
    return Array.from(this._shapeMapping.values());
  }

  public get(id: string) {
    return this._shapeMapping.get(id);
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
