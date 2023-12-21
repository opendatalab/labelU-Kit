import cloneDeep from 'lodash.clonedeep';

import { eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import type { AxisPoint, LineParams } from '../shapes';
import { Line } from '../shapes';

export interface ControllerEdgeOptions extends LineParams {
  name?: string;
}

type EdgeHandler = (e: MouseEvent, edge: ControllerEdge) => void;

export class ControllerEdge extends Line {
  public previousDynamicCoordinate: AxisPoint[] | null = null;

  private _onMoveHandlers: EdgeHandler[] = [];

  private _onMouseDownHandlers: EdgeHandler[] = [];

  private _onMouseUpHandlers: EdgeHandler[] = [];

  private _originalStyle: LineParams['style'] = {};

  public name?: string;

  constructor({ name, ...params }: ControllerEdgeOptions) {
    super(params);

    this.name = name;
    this._originalStyle = cloneDeep(this.style);

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    this.on(EInternalEvent.ShapeOver, this._onShapeOver);
    this.on(EInternalEvent.ShapeOut, this._onShapeOut);
  }

  private _onShapeOver = () => {
    this.updateStyle({
      strokeWidth: (this._originalStyle?.strokeWidth ?? 4) + 4,
    });
  };

  private _onShapeOut = () => {
    this.updateStyle(this._originalStyle ?? {});
  };

  private _handleMouseDown = (e: MouseEvent) => {
    if (this.isMouseOver) {
      this.previousDynamicCoordinate = cloneDeep(this.dynamicCoordinate);

      for (const handler of this._onMouseDownHandlers) {
        handler(e, this);
      }
    }
  };

  private _handleMouseMove = (e: MouseEvent) => {
    const { previousDynamicCoordinate, _onMoveHandlers } = this;

    if (!previousDynamicCoordinate) {
      return;
    }

    for (const handler of _onMoveHandlers) {
      handler(e, this);
    }
  };

  private _handleMouseUp = (e: MouseEvent) => {
    const { previousDynamicCoordinate } = this;

    if (!previousDynamicCoordinate) {
      return;
    }

    this.previousDynamicCoordinate = null;

    for (const handler of this._onMouseUpHandlers) {
      handler(e, this);
    }
  };

  public onMove(handler: EdgeHandler) {
    this._onMoveHandlers.push(handler);
  }

  public onMouseDown(handler: EdgeHandler) {
    this._onMouseDownHandlers.push(handler);
  }

  public onMouseUp(handler: EdgeHandler) {
    this._onMouseUpHandlers.push(handler);
  }

  public destroy() {
    super.destroy();
    this._onMoveHandlers = [];
    eventEmitter.off(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.off(EInternalEvent.LeftMouseUp, this._handleMouseUp);
  }
}
