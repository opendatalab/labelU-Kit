import { EInternalEvent } from '../enums';
import type { AxisPoint, Shape } from '../shapes';
import { axis, eventEmitter } from '../singletons';

export interface DomPortalParams {
  x: number;
  y: number;
  offset?: AxisPoint;
  element: HTMLElement;
  bindShape: Shape<any>;
}

export class DomPortal {
  public x: number = 0;

  public y: number = 0;

  public offset: AxisPoint = { x: 0, y: 0 };

  private _element: HTMLElement | null = null;

  private _container: HTMLElement = axis!.renderer!.canvas.parentElement!;

  private _shape: Shape<any>;

  constructor({ x, y, element, bindShape, offset }: DomPortalParams) {
    this.x = x;
    this.y = y;
    this._element = element;
    this._shape = bindShape;

    if (offset) {
      this.offset = offset;
    }

    if (bindShape) {
      eventEmitter.on(EInternalEvent.AxisChange, this._handleUpdatePosition);
      eventEmitter.on(EInternalEvent.MouseMove, this._handleUpdatePositionByMouse);
    }

    if (!element) {
      throw new Error('Element must be set');
    }

    if (this._container.contains(element)) {
      console.warn('Container already contains the element');
    }

    this._container.appendChild(element);
    this._setupElementStyle();
  }

  private _setupElementStyle() {
    const { _element, x, y, offset } = this;

    if (!_element) {
      return;
    }

    _element.style.position = 'absolute';
    _element.style.left = '0';
    _element.style.top = '0';
    _element.style.userSelect = 'none';
    _element.style.display = 'block';
    _element.style.zIndex = '2';
    _element.style.transform = `translate(${x + offset.x}px, ${y + offset.y}px)`;
  }

  private _handleUpdatePosition = () => {
    const { _shape } = this;

    this._updatePosition(_shape.dynamicCoordinate[0].x, _shape.dynamicCoordinate[0].y);
  };

  private _handleUpdatePositionByMouse = () => {
    if (axis?.distance.x || axis?.distance.y) {
      const { _shape } = this;

      this._updatePosition(_shape.dynamicCoordinate[0].x, _shape.dynamicCoordinate[0].y);
    }
  };

  private _updatePosition(x: number, y: number) {
    const { _element, offset } = this;

    this.x = x;
    this.y = y;

    if (_element) {
      if (x < 0 || y < 0) {
        _element.style.display = 'none';
      } else {
        _element.style.display = 'block';
      }
      _element.style.transform = `translate(${this.x + offset.x}px, ${this.y + offset.y}px)`;
    }
  }

  public destroy() {
    this._element?.remove();
    eventEmitter.off(EInternalEvent.AxisChange, this._handleUpdatePosition);
    eventEmitter.off(EInternalEvent.MouseMove, this._handleUpdatePositionByMouse);
  }
}
