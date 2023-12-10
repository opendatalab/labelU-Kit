import cloneDeep from 'lodash.clonedeep';

import { axis, eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import type { AxisPoint, PointParams } from '../shapes';
import { Point } from '../shapes';

const DEFAULT_STYLE = {
  ...Point.DEFAULT_STYLE,
  stroke: 'transparent',
  strokeWidth: 0,
  fill: 'blue',
  radius: 8,
};

const HOVERED_STYLE = {
  ...Point.DEFAULT_STYLE,
  stroke: '#fff',
  strokeWidth: 4,
  fill: 'blue',
  radius: 8,
};

// TODO: 增加控制点的样式配置
export class ControllerPoint extends Point {
  private _previousDynamicCoordinate: AxisPoint | null = null;

  private _onMoveHandlers: ((controller: ControllerPoint) => void)[] = [];

  private _onMouseDownHandlers: ((controller: ControllerPoint) => void)[] = [];

  private _onMouseUpHandlers: ((controller: ControllerPoint) => void)[] = [];

  constructor(params: PointParams) {
    super({ ...params, style: DEFAULT_STYLE });

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    this.on(EInternalEvent.ShapeOver, this._onShapeOver);
    this.on(EInternalEvent.ShapeOut, this._onShapeOut);
  }

  private _onShapeOver = () => {
    this.updateStyle(HOVERED_STYLE);
  };

  private _onShapeOut = () => {
    this.updateStyle(DEFAULT_STYLE);
  };

  private _handleMouseDown = () => {
    if (this.isMouseOver) {
      this._previousDynamicCoordinate = cloneDeep(this.dynamicCoordinate[0]);

      for (const handler of this._onMouseDownHandlers) {
        handler(this);
      }
    }
  };

  private _handleMouseMove = () => {
    const { _previousDynamicCoordinate, _onMoveHandlers } = this;

    if (!_previousDynamicCoordinate) {
      return;
    }

    this.coordinate = [
      axis!.getOriginalCoord({
        x: _previousDynamicCoordinate.x + axis!.distance.x,
        y: _previousDynamicCoordinate.y + axis!.distance.y,
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

  public onMove(handler: (controller: ControllerPoint) => void) {
    this._onMoveHandlers.push(handler);
  }

  public onMouseDown(handler: (controller: ControllerPoint) => void) {
    this._onMouseDownHandlers.push(handler);
  }

  public onMouseUp(handler: (controller: ControllerPoint) => void) {
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
