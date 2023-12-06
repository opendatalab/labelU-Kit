import EventEmitter from 'eventemitter3';
import type { BBox } from 'rbush';

import type { Shape } from './Shape';
import { EInternalEvent } from '../enums';
import type { RBushItem } from '../singletons';
import { eventEmitter, rbush } from '../singletons';
import { Point, type AxisPoint } from './Point.shape';

/**
 * 组合类，用于组合多个图形
 */
export class Group<T extends Shape<Style>, Style> {
  public id: string;

  public order: number;

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

  constructor(id: string, order: number) {
    this.id = id;
    this.order = order;
    this._bindEvents();
  }

  private _bindEvents() {
    // 组合的变化只需要在移动结束和缩放结束后更新
    eventEmitter.on(EInternalEvent.PanEnd, this._onAxisChange);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._onAxisChange);
    eventEmitter.on(EInternalEvent.AnnotationMove, this._onAxisChange);
    eventEmitter.on(EInternalEvent.Zoom, this._onAxisChange);
  }

  private _onAxisChange = () => {
    // 组合在图形之后创建，所以需要延迟一帧更新
    setTimeout(() => {
      this._updateBBox()._updateRBush();
    });
  };

  public update() {
    this._updateBBox()._updateRBush();
  }

  private _updateBBox() {
    const finalShapes = this.shapes.filter((shape) => {
      if (shape instanceof Point && shape.groupIgnoreRadius) {
        return false;
      }
      return true;
    });

    const minX = Math.min(...finalShapes.map((shape) => shape.bbox.minX));
    const minY = Math.min(...finalShapes.map((shape) => shape.bbox.minY));
    const maxX = Math.max(...finalShapes.map((shape) => shape.bbox.maxX));
    const maxY = Math.max(...finalShapes.map((shape) => shape.bbox.maxY));

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
        _group: this,
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
      if (this._shapeMapping.has(shape.id)) {
        throw Error(`Shape with id ${shape.id} already exists!`);
      }

      this._shapeMapping.set(shape.id, shape);
    });

    this.update();
  }

  /**
   * 获取在鼠标指针下的标注id
   */
  public isShapesUnderCursor(mouseCoord: AxisPoint): string | undefined {
    const shapes = this.shapes;

    for (let i = 0; i < shapes.length; i += 1) {
      const item = shapes[i];

      if (item.isUnderCursor(mouseCoord)) {
        return item.id;
      }
    }
  }

  public remove(...shapes: T[]) {
    shapes.forEach((shape) => {
      this._shapeMapping.delete(shape.id);
    });

    this.update();
  }

  public each(callback: (shape: T, idx: number) => void | boolean) {
    let shouldContinue = true;

    for (let i = 0; i < this.shapes.length; i += 1) {
      if (shouldContinue === false) {
        break;
      }

      shouldContinue = callback(this.shapes[i], i) as boolean;
    }
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
    rbush.remove(this._cachedRBush!);
    this._shapeMapping.clear();
    this._event.removeAllListeners();
    eventEmitter.off(EInternalEvent.PanEnd, this._onAxisChange);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._onAxisChange);
    eventEmitter.off(EInternalEvent.AnnotationMove, this._onAxisChange);
    eventEmitter.off(EInternalEvent.Zoom, this._onAxisChange);
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
