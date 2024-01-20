import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';

import { EInternalEvent } from '../enums';
import type { AxisPoint, LineStyle, Point, PointStyle } from '../shapes';
import { Line } from '../shapes';
import { Group } from '../shapes/Group';
import { ControllerPoint } from './ControllerPoint';
import { axis, monitor } from '../singletons';

export interface SlopeEdgeParams {
  /** 前一条曲线的结束控制点，第一条曲线没有 */
  endControlOfPrevCurve?: AxisPoint;

  /** 曲线切点 */
  contact: AxisPoint;

  /** 后一条曲线的开始控制点，最后一条曲线没有 */
  startControlOfNextCurve?: AxisPoint;
}

export class SlopeEdge extends Group<Line | Point, LineStyle | PointStyle> {
  public name?: string;

  public previousDynamicCoordinate: AxisPoint[][] | null = null;

  private _endControlCoordOfPrevCurve: AxisPoint | undefined;

  private _endSlopePointOfPrevCurve: ControllerPoint | null = null;

  private _startSlopePointOfNextCurve: ControllerPoint | null = null;

  private _startControlCoordOfNextCurve: AxisPoint | undefined;

  private _contactCoord: AxisPoint;

  /**
   * NOTE: 给monitor鼠标经过的判断标识，目前只有曲线的控制器是组合Group
   */
  public IS_CONTROL = true;

  private _contactPoint: ControllerPoint | null = null;

  constructor({
    endControlOfPrevCurve: prevCurveEndControl,
    startControlOfNextCurve: nextCurveStartControl,
    contact,
  }: SlopeEdgeParams) {
    super(uuid(), monitor!.getNextOrder());

    this._endControlCoordOfPrevCurve = prevCurveEndControl;
    this._startControlCoordOfNextCurve = nextCurveStartControl;
    this._contactCoord = contact;

    this._setupShapes();
  }

  private _setupShapes() {
    const { _endControlCoordOfPrevCurve, _startControlCoordOfNextCurve, _contactCoord } = this;

    if (_endControlCoordOfPrevCurve) {
      this.add(
        new Line({
          id: uuid(),
          coordinate: [{ ..._endControlCoordOfPrevCurve }, { ..._contactCoord }],
          style: {
            stroke: '#fff',
            strokeWidth: 1,
          },
        }),
      );
      const prevCurveEndControl = new ControllerPoint({
        // 如果是从左往右画，这个点是上一个曲线的结束控制点
        name: 'end',
        id: uuid(),
        coordinate: { ..._endControlCoordOfPrevCurve },
      });

      this._endSlopePointOfPrevCurve = prevCurveEndControl;

      prevCurveEndControl.onMouseDown(this._handleSlopeDown);
      prevCurveEndControl.onMove(this._handleSlopeMove);
      prevCurveEndControl.onMouseUp(this._handleSlopeUp);

      this.add(prevCurveEndControl);
    }

    if (_startControlCoordOfNextCurve) {
      this.add(
        new Line({
          id: uuid(),
          coordinate: [{ ..._contactCoord }, { ..._startControlCoordOfNextCurve }],
          style: {
            stroke: '#fff',
            strokeWidth: 1,
          },
        }),
      );
      const nextCurveStartControl = new ControllerPoint({
        name: 'start',
        id: uuid(),
        coordinate: { ..._startControlCoordOfNextCurve },
      });

      this._startSlopePointOfNextCurve = nextCurveStartControl;

      nextCurveStartControl.onMouseDown(this._handleSlopeDown);
      nextCurveStartControl.onMove(this._handleSlopeMove);
      nextCurveStartControl.onMouseUp(this._handleSlopeUp);

      this.add(nextCurveStartControl);
    }

    const contactPoint = new ControllerPoint({
      name: 'contact',
      id: uuid(),
      coordinate: { ..._contactCoord },
    });

    this._contactPoint = contactPoint;

    contactPoint.onMouseDown(this._handleContactDown);
    contactPoint.onMove(this._handleContactMove);
    contactPoint.onMouseUp(this._handleContactUp);

    this.add(contactPoint);
  }

  private _handleSlopeDown = (point: ControllerPoint) => {
    const { _contactPoint } = this;
    this.emit(EInternalEvent.SlopeDown, point, _contactPoint);
  };

  private _handleSlopeMove = (point: ControllerPoint) => {
    const { _endControlCoordOfPrevCurve } = this;
    if (point.name === 'end') {
      this.shapes[0].coordinate[0].x = point.coordinate[0].x;
      this.shapes[0].coordinate[0].y = point.coordinate[0].y;
    } else if (point.name === 'start') {
      if (!_endControlCoordOfPrevCurve) {
        // 最后一个曲线的结束点，没有结束控制点，所以只有一条线
        this.shapes[0].coordinate[1].x = point.coordinate[0].x;
        this.shapes[0].coordinate[1].y = point.coordinate[0].y;
      } else {
        this.shapes[2].coordinate[1].x = point.coordinate[0].x;
        this.shapes[2].coordinate[1].y = point.coordinate[0].y;
      }
    } else {
      throw new Error('Invalid point name!');
    }

    this.update();

    this.emit(EInternalEvent.SlopeMove, point);
  };

  private _handleSlopeUp = (point: ControllerPoint) => {
    this.emit(EInternalEvent.SlopeUp, point);
  };

  private _handleContactDown = (point: ControllerPoint) => {
    const { _endSlopePointOfPrevCurve, _startSlopePointOfNextCurve } = this;
    this.previousDynamicCoordinate = this.shapes.map((shape) => {
      return cloneDeep(shape.dynamicCoordinate);
    });
    this.emit(EInternalEvent.ContactDown, point, _endSlopePointOfPrevCurve, _startSlopePointOfNextCurve);
  };

  /**
   * 切点移动
   * @description 切点移动时，需要更新切点的控制点
   * @param point
   */
  private _handleContactMove = (point: ControllerPoint) => {
    const { previousDynamicCoordinate, _endSlopePointOfPrevCurve, _startSlopePointOfNextCurve } = this;

    this.each((shape, index) => {
      if ((shape as Point).name !== 'contact' && previousDynamicCoordinate) {
        shape.coordinate[0].x = axis!.getOriginalX(previousDynamicCoordinate[index][0].x + axis!.distance.x);
        shape.coordinate[0].y = axis!.getOriginalY(previousDynamicCoordinate[index][0].y + axis!.distance.y);

        if (shape instanceof Line) {
          shape.coordinate[1].x = axis!.getOriginalX(previousDynamicCoordinate[index][1].x + axis!.distance.x);
          shape.coordinate[1].y = axis!.getOriginalY(previousDynamicCoordinate[index][1].y + axis!.distance.y);
        }
      }
    });
    this.emit(EInternalEvent.ContactMove, point, _endSlopePointOfPrevCurve, _startSlopePointOfNextCurve);
    this.update();
  };

  private _handleContactUp = () => {
    this.emit(EInternalEvent.ContactUp);
  };

  private _onControllerPointDown = (_point: ControllerPoint) => {};

  private _onControllerPointMove = (_point: ControllerPoint) => {};

  private _onControllerPointUp = (_point: ControllerPoint) => {};

  public get contactPoint() {
    return this._contactPoint;
  }

  public get endControlOfPrevCurve() {
    return this._endSlopePointOfPrevCurve;
  }

  public get startControlOfNextCurve() {
    return this._startSlopePointOfNextCurve;
  }

  public isUnderCursor = this.isShapesUnderCursor;
}
