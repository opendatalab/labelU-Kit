import type { BBox } from 'rbush';
import cloneDeep from 'lodash.clonedeep';

import { axis, eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import type { Annotation } from '../annotations/Annotation';
import type { BasicImageAnnotation } from '../interface';
import { Point } from '../shapes';
import type { AxisPoint, Shape } from '../shapes';
import { ControllerPoint } from './ControllerPoint';
import { ControllerEdge } from './ControllerEdge';
import { LabelBase } from '../annotations/Label.base';

type Constructor<T extends {}> = new (...args: any[]) => T;

type MouseEventHandler = (e: MouseEvent) => void;

type MouseListenerHandler = (handler: MouseEventHandler) => void;

export interface IDraftObserver {
  isPicked: boolean;

  labelColor: string;

  onMove: MouseListenerHandler;
  onMouseDown: MouseListenerHandler;
  onMouseUp: MouseListenerHandler;
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  destroy(): void;

  // eslint-disable-next-line @typescript-eslint/method-signature-style
  clearHandlers(): void;

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

    public outOfImage: boolean = true;

    public labelColor = LabelBase.DEFAULT_COLOR;

    private _onMoveHandlers: MouseEventHandler[] = [];

    private _onMouseDownHandlers: MouseEventHandler[] = [];

    private _onMouseUpHandlers: MouseEventHandler[] = [];

    private _preDynamicCoordinates: AxisPoint[][] = [];

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
      // 如果鼠标落在控制点或者控制边上，不选中草稿
      if (this._isControlUnderCursor({ x: e.offsetX, y: e.offsetY })) {
        return;
      }

      // 存在草稿说明当前处于编辑状态，只需要判断鼠标是否落在在草稿上即可
      if (this.isUnderCursor({ x: e.offsetX, y: e.offsetY })) {
        this.isPicked = true;
        this._preDynamicCoordinates = this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));

        for (const handler of this._onMouseDownHandlers) {
          handler(e);
        }
      }
    };

    private _isControlUnderCursor(mouseCoord: AxisPoint) {
      const controls = this._getControls();

      for (const control of controls) {
        if (control.isUnderCursor(mouseCoord)) {
          return true;
        }
      }

      return false;
    }

    private _getControls() {
      const { group } = this;
      const controls: (ControllerPoint | ControllerEdge)[] = [];

      for (const shape of group.shapes) {
        if (shape instanceof ControllerPoint || shape instanceof ControllerEdge) {
          controls.push(shape);
        }
      }

      return controls;
    }

    private _handleMouseMove = (e: MouseEvent) => {
      const { _onMoveHandlers, isPicked } = this;

      if (!isPicked) {
        return;
      }

      // 统一在这里移动草稿
      this.moveByDistance();

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
      this._preDynamicCoordinates = [];

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
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let i = 0; i < this.group.shapes.length; i += 1) {
        const shape = this.group.shapes[i];

        if (shape instanceof Point) {
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

    /**
     * 根据鼠标移动的距离移动草稿
     */
    public moveByDistance() {
      const { outOfImage, _preDynamicCoordinates } = this;

      const [safeX, safeY] = outOfImage ? [true, true] : axis!.isCoordinatesSafe(_preDynamicCoordinates);

      // 更新草稿坐标
      this.group.each((shape, index) => {
        shape.plainCoordinate.forEach((point, i) => {
          if (safeX) {
            shape.coordinate[i].x = axis!.getOriginalX(_preDynamicCoordinates[index][i].x + axis!.distance.x);
          }

          if (safeY) {
            shape.coordinate[i].y = axis!.getOriginalY(_preDynamicCoordinates[index][i].y + axis!.distance.y);
          }
        });
      });

      // 手动更新组合的包围盒
      this.group.update();
    }

    public render(ctx: CanvasRenderingContext2D) {
      // 选中的标注需要在最上层
      Promise.resolve().then(() => {
        this.group.render(ctx);
      });
    }

    public clearHandlers() {
      this._onMoveHandlers = [];
      this._onMouseDownHandlers = [];
      this._onMouseUpHandlers = [];
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
