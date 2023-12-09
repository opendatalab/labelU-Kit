import cloneDeep from 'lodash.clonedeep';

import { axis, eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import type { AxisPoint, LineParams } from '../shapes';
import { Line } from '../shapes';

export interface ControllerEdgeOptions extends LineParams {
  name?: string;
}

export class ControllerEdge extends Line {
  private _previousDynamicCoordinate: AxisPoint | null = null;

  private _onMoveHandlers: ((edge: ControllerEdge) => void)[] = [];

  private _onMouseDownHandlers: ((edge: ControllerEdge) => void)[] = [];

  private _onMouseUpHandlers: ((edge: ControllerEdge) => void)[] = [];

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
      strokeWidth: 10,
    });
  };

  private _onShapeOut = () => {
    this.updateStyle(this._originalStyle ?? {});
  };

  private _handleMouseDown = () => {
    if (this.isMouseOver) {
      this._previousDynamicCoordinate = cloneDeep(this.dynamicCoordinate[0]);

      for (const handler of this._onMouseDownHandlers) {
        handler(this);
      }
    }
  };

  private _handleMouseMove = (e: MouseEvent) => {
    const { _previousDynamicCoordinate, _onMoveHandlers } = this;

    if (!_previousDynamicCoordinate) {
      return;
    }

    this.coordinate = [
      axis!.getOriginalCoord({
        x: e.offsetX,
        y: e.offsetY,
      }),
    ];

    for (const handler of _onMoveHandlers) {
      handler(this);
    }
  };

  private _handleMouseUp = () => {
    const { _previousDynamicCoordinate } = this;

    if (!_previousDynamicCoordinate) {
      return;
    }

    this._previousDynamicCoordinate = null;

    for (const handler of this._onMouseUpHandlers) {
      handler(this);
    }
  };

  public onMove(handler: (edge: ControllerEdge) => void) {
    this._onMoveHandlers.push(handler);
  }

  public onMouseDown(handler: (edge: ControllerEdge) => void) {
    this._onMouseDownHandlers.push(handler);
  }

  public onMouseUp(handler: (edge: ControllerEdge) => void) {
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
