import EventEmitter from 'eventemitter3';
import type { BBox } from 'rbush';

import { EInternalEvent } from '../enums';
import type { RBushItem } from '../core/CustomRBush';
import { eventEmitter, rbush } from '../singletons';
import type { PointStyle, AxisPoint } from './Point.shape';
import { ShapeText } from './Text.shape';
import type { AllShape } from './types';
import type { RectStyle } from './Rect.shape';
import type { LineStyle } from './Line.shape';
import type { PolygonStyle } from './Polygon.shape';

type Style = RectStyle | LineStyle | PolygonStyle | PointStyle;

/**
 * 组合类，用于组合多个图形
 */
export class Group {
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

  private _shapes: AllShape[] = [];

  private _shapeMapping: Map<string, AllShape> = new Map();

  private _event = new EventEmitter();

  /**
   * 当鼠标经过时，draft应该置顶
   */
  public isTop: boolean = false;

  constructor(id: string, order: number, isTop?: boolean) {
    this.id = id;
    this.order = order;
    this._bindEvents();
    this.isTop = isTop || false;
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
    Promise.resolve().then(() => {
      this._updateBBox()._updateRBush();
    });
  };

  public update() {
    this._updateBBox()._updateRBush();
  }

  private _updateBBox() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < this.shapes.length; i += 1) {
      const shape = this.shapes[i];

      minX = Math.min(minX, shape.bbox.minX);
      minY = Math.min(minY, shape.bbox.minY);
      maxX = Math.max(maxX, shape.bbox.maxX);
      maxY = Math.max(maxY, shape.bbox.maxY);
    }

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

  public getBBoxByFilter(filter: (shape: AllShape) => boolean): BBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < this.shapes.length; i += 1) {
      const shape = this.shapes[i];

      if (!filter(shape)) {
        continue;
      }

      minX = Math.min(minX, shape.bbox.minX);
      minY = Math.min(minY, shape.bbox.minY);
      maxX = Math.max(maxX, shape.bbox.maxX);
      maxY = Math.max(maxY, shape.bbox.maxY);
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
    };
  }

  public updateStyle(style: Style) {
    const shapes = this.shapes;

    for (let i = 0; i < shapes.length; i += 1) {
      const item = shapes[i];

      item.updateStyle(style);
    }
  }

  public add(...shapes: AllShape[]) {
    shapes.forEach((shape) => {
      if (this._shapeMapping.has(shape.id)) {
        throw Error(`Shape with id ${shape.id} already exists!`);
      }

      this._shapeMapping.set(shape.id, shape);
      this._shapes.push(shape);
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

      if (item instanceof ShapeText) {
        continue;
      }

      if (item.isUnderCursor(mouseCoord)) {
        return item.id;
      }
    }
  }

  public insert(index: number, ...shapes: AllShape[]) {
    shapes.forEach((shape) => {
      if (this._shapeMapping.has(shape.id)) {
        throw Error(`Shape with id ${shape.id} already exists!`);
      }

      this._shapeMapping.set(shape.id, shape);
      this._shapes.splice(index, 0, shape);
    });

    this.update();
  }

  public remove(...shapes: AllShape[]) {
    const { _shapeMapping, _shapes } = this;

    shapes.forEach((shape) => {
      shape.destroy();
      _shapeMapping.delete(shape.id);
      _shapes.splice(_shapes.indexOf(shape), 1);
    });

    this.update();
  }

  public each(callback: (shape: AllShape, idx: number) => void | boolean) {
    let shouldContinue = true;

    for (let i = 0; i < this.shapes.length; i += 1) {
      if (shouldContinue === false) {
        break;
      }

      shouldContinue = callback(this.shapes[i], i) as boolean;
    }
  }

  public reverseEach(callback: (shape: AllShape, idx: number) => void | boolean) {
    let shouldContinue = true;

    for (let i = this.shapes.length - 1; i >= 0; i -= 1) {
      if (shouldContinue === false) {
        break;
      }

      shouldContinue = callback(this.shapes[i], i) as boolean;
    }
  }

  public last() {
    return this.shapes[this.shapes.length - 1];
  }

  public indexOf(shape: AllShape) {
    return this.shapes.indexOf(shape);
  }

  public render(ctx: CanvasRenderingContext2D) {
    this.shapes.forEach((shape) => {
      shape.render(ctx);
    });
  }

  public destroy() {
    rbush.remove(this._cachedRBush!);
    this._cachedRBush = null;
    this.shapes.forEach((shape) => {
      shape.destroy();
    });
    this._shapeMapping.clear();
    this._event.removeAllListeners();
    eventEmitter.off(EInternalEvent.PanEnd, this._onAxisChange);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._onAxisChange);
    eventEmitter.off(EInternalEvent.AnnotationMove, this._onAxisChange);
    eventEmitter.off(EInternalEvent.Zoom, this._onAxisChange);
  }

  public clear() {
    this._shapes.forEach((shape) => {
      shape.destroy();
    });
    this._shapes = [];
    rbush.remove(this._cachedRBush!);
    this._shapeMapping.clear();
  }

  public get shapes() {
    return this._shapes;
  }

  public get(id: string) {
    return this._shapeMapping.get(id);
  }

  public serialize() {
    const shapes = this.shapes.map((shape) => {
      return shape.serialize();
    });

    return {
      id: this.id,
      order: this.order,
      shapes,
    };
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
