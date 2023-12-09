import type { BBox } from 'rbush';

import { eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import type { Annotation } from '../annotation/Annotation';
import type { BasicImageAnnotation } from '../interface';
import { Point } from '../shapes';
import type { AxisPoint, Shape } from '../shapes';

type Constructor<T extends {}> = new (...args: any[]) => T;

type MouseEventHandler = (e: MouseEvent) => void;

type MouseListenerHandler = (handler: MouseEventHandler) => void;

export interface IDraftObserver {
  isPicked: boolean;
  onMove: MouseListenerHandler;
  onMouseDown: MouseListenerHandler;
  onMouseUp: MouseListenerHandler;
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  destroy(): void;

  // eslint-disable-next-line @typescript-eslint/method-signature-style
  isUnderCursor(mouseCoord: AxisPoint): boolean;

  // eslint-disable-next-line @typescript-eslint/method-signature-style
  getBBoxWithoutControllerPoint(): BBox;
}

export function DraftObserverMixin<
  T extends Constructor<Annotation<Data, IShape, Style>>,
  Data extends BasicImageAnnotation,
  IShape extends Shape<Style>,
  Style extends Record<string, any>,
>(Base: T): T & Constructor<IDraftObserver> {
  return class extends Base {
    public isPicked = false;

    private _onMoveHandlers: MouseEventHandler[] = [];

    private _onMouseDownHandlers: MouseEventHandler[] = [];

    private _onMouseUpHandlers: MouseEventHandler[] = [];

    constructor(...params: any[]) {
      super(...params);

      // 应该让草稿内的图形对象先于草稿对象监听鼠标事件
      // TODO：模仿DOM的事件设计冒泡机制，处理重叠的图形鼠标事件
      setTimeout(() => {
        eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
        eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
        eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
      });
    }

    private _handleMouseDown = (e: MouseEvent) => {
      // 存在草稿说明当前处于编辑状态，只需要判断鼠标是否落在在草稿上即可
      if (this.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
        this.isPicked = true;

        for (const handler of this._onMouseDownHandlers) {
          handler(e);
        }
      }
    };

    private _handleMouseMove = (e: MouseEvent) => {
      const { _onMoveHandlers, isPicked } = this;

      if (!isPicked) {
        return;
      }

      for (const handler of _onMoveHandlers) {
        handler(e);
      }
    };

    private _handleMouseUp = (e: MouseEvent) => {
      const { isPicked } = this;

      if (!isPicked) {
        return;
      }

      this.isPicked = false;

      for (const handler of this._onMouseUpHandlers) {
        handler(e);
      }
    };

    public onMove(handler: MouseEventHandler) {
      this._onMoveHandlers.push(handler);
    }

    public onMouseDown(handler: MouseEventHandler) {
      this._onMouseDownHandlers.push(handler);
    }

    public onMouseUp(handler: MouseEventHandler) {
      this._onMouseUpHandlers.push(handler);
    }

    /**
     * 获取组合除去控制点的包围盒
     *
     * @description 对于一些特殊的图形，比如圆，创建选框时在组内需要忽略半径
     */
    public getBBoxWithoutControllerPoint() {
      const finalShapes = this.group.shapes.filter((shape) => {
        return !(shape instanceof Point);
      });

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let i = 0; i < finalShapes.length; i += 1) {
        const shape = finalShapes[i];

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

    public isUnderCursor(mouseCoord: AxisPoint) {
      const bbox = this.getBBoxWithoutControllerPoint();

      if (
        mouseCoord.x >= bbox.minX &&
        mouseCoord.x <= bbox.maxX &&
        mouseCoord.y >= bbox.minY &&
        mouseCoord.y <= bbox.maxY
      ) {
        return true;
      }

      return false;
    }

    public destroy() {
      super.destroy();

      this._onMoveHandlers = [];
      this._onMouseDownHandlers = [];
      this._onMouseUpHandlers = [];

      eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
      eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
      eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    }
  };
}
