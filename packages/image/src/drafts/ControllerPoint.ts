import cloneDeep from 'lodash.clonedeep';

import { axis, eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import type { AxisPoint, PointParams } from '../shapes';
import { Point } from '../shapes';

const DEFAULT_STYLE = {
  stroke: 'transparent',
  strokeWidth: 0,
  fill: '#e6e6e6',
  radius: 4,
};

const HOVERED_STYLE = {
  stroke: '#fff',
  strokeWidth: 4,
  fill: '#e6e6e6',
  radius: 4,
};

type ControlMoveHandler = (controller: ControllerPoint, e: MouseEvent) => void;

export interface ControllerPointParams extends PointParams {
  outOfImage?: boolean;

  disabled?: boolean;
}

export class ControllerPoint extends Point {
  private _previousDynamicCoordinate: AxisPoint | null = null;

  private _outOfCanvas: boolean = true;

  private _onMoveHandlers: ControlMoveHandler[] = [];

  private _onMouseDownHandlers: ControlMoveHandler[] = [];

  private _onMouseUpHandlers: ControlMoveHandler[] = [];

  private _disabled: boolean = false;

  constructor({ outOfImage, disabled, ...params }: ControllerPointParams) {
    super({ ...params, style: DEFAULT_STYLE });

    this._outOfCanvas = outOfImage ?? true;

    this._disabled = disabled ?? false;

    eventEmitter.on(EInternalEvent.LeftMouseDown, this._handleMouseDown);
    eventEmitter.on(EInternalEvent.MouseMove, this._handleMouseMove);
    eventEmitter.on(EInternalEvent.LeftMouseUp, this._handleMouseUp);
    this.on(EInternalEvent.ShapeOver, this._onShapeOver);
    this.on(EInternalEvent.ShapeOut, this._onShapeOut);
  }

  private _onShapeOver = () => {
    if (this._disabled) {
      return;
    }

    this.updateStyle(HOVERED_STYLE);
  };

  private _onShapeOut = () => {
    if (this._disabled) {
      return;
    }

    this.updateStyle(DEFAULT_STYLE);
  };

  private _handleMouseDown = (e: MouseEvent) => {
    if (this._disabled) {
      return;
    }

    if (this.isMouseOver) {
      this._previousDynamicCoordinate = cloneDeep(this.dynamicCoordinate[0]);

      for (const handler of this._onMouseDownHandlers) {
        handler(this, e);
      }
    }
  };

  private _handleMouseMove = (e: MouseEvent) => {
    if (this._disabled) {
      return;
    }

    const { _previousDynamicCoordinate, _onMoveHandlers, _outOfCanvas } = this;

    if (!_previousDynamicCoordinate) {
      return;
    }

    let x = _previousDynamicCoordinate.x + axis!.distance.x;
    let y = _previousDynamicCoordinate.y + axis!.distance.y;

    // 安全区域内移动
    if (!_outOfCanvas) {
      x = axis!.getSafeX(x);
      y = axis!.getSafeY(y);
    }

    this.coordinate = [axis!.getOriginalCoord({ x, y })];

    for (const handler of _onMoveHandlers) {
      handler(this, e);
    }
  };

  private _handleMouseUp = (e: MouseEvent) => {
    if (this._disabled) {
      return;
    }

    const { _previousDynamicCoordinate } = this;

    if (!_previousDynamicCoordinate) {
      return;
    }

    this._previousDynamicCoordinate = null;

    for (const handler of this._onMouseUpHandlers) {
      handler(this, e);
    }

    eventEmitter.emit('change');
  };

  public clone() {
    return new ControllerPoint({
      id: this.id,
      coordinate: cloneDeep(this.coordinate[0]),
      outOfImage: this._outOfCanvas,
    });
  }

  public onMove(handler: ControlMoveHandler) {
    this._onMoveHandlers.push(handler);
  }

  public onMouseDown(handler: ControlMoveHandler) {
    this._onMouseDownHandlers.push(handler);
  }

  public onMouseUp(handler: ControlMoveHandler) {
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
