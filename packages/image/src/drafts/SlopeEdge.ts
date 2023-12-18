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
  prevCurveEndControl?: AxisPoint;

  /** 曲线切点 */
  contact: AxisPoint;

  /** 后一条曲线的开始控制点，最后一条曲线没有 */
  nextCurveStartControl?: AxisPoint;
}

export class SlopeEdge extends Group<any, LineStyle | PointStyle> {
  public previousDynamicCoordinate: AxisPoint[][] | null = null;

  private _prevCurveEndControlCoord: AxisPoint | undefined;

  private _prevCurveEndSlopePoint: ControllerPoint | null = null;

  private _nextCurveEndSlopePoint: ControllerPoint | null = null;

  private _nextCurveStartControlCoord: AxisPoint | undefined;

  private _contactCoord: AxisPoint;

  private _contactPoint: ControllerPoint | null = null;

  public name?: string;

  constructor({ prevCurveEndControl, nextCurveStartControl, contact }: SlopeEdgeParams) {
    super(uuid(), monitor!.getMaxOrder()! + 1);

    this._prevCurveEndControlCoord = prevCurveEndControl;
    this._nextCurveStartControlCoord = nextCurveStartControl;
    this._contactCoord = contact;

    this._setupShapes();
  }

  private _setupShapes() {
    const { _prevCurveEndControlCoord, _nextCurveStartControlCoord, _contactCoord } = this;

    if (_prevCurveEndControlCoord) {
      this.add(
        new Line({
          id: uuid(),
          coordinate: [{ ..._prevCurveEndControlCoord }, { ..._contactCoord }],
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
        coordinate: { ..._prevCurveEndControlCoord },
      });

      this._prevCurveEndSlopePoint = prevCurveEndControl;

      prevCurveEndControl.onMouseDown(this._handleSlopeDown);
      prevCurveEndControl.onMove(this._handleSlopeMove);
      prevCurveEndControl.onMouseUp(this._handleSlopeUp);

      this.add(prevCurveEndControl);
    }

    if (_nextCurveStartControlCoord) {
      this.add(
        new Line({
          id: uuid(),
          coordinate: [{ ..._contactCoord }, { ..._nextCurveStartControlCoord }],
          style: {
            stroke: '#fff',
            strokeWidth: 1,
          },
        }),
      );
      const nextCurveStartControl = new ControllerPoint({
        name: 'start',
        id: uuid(),
        coordinate: { ..._nextCurveStartControlCoord },
      });

      this._nextCurveEndSlopePoint = nextCurveStartControl;

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
    const { _prevCurveEndControlCoord } = this;
    if (point.name === 'end') {
      this.shapes[0].coordinate[0].x = point.coordinate[0].x;
      this.shapes[0].coordinate[0].y = point.coordinate[0].y;
    } else if (point.name === 'start') {
      if (!_prevCurveEndControlCoord) {
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
    const { _prevCurveEndSlopePoint, _nextCurveEndSlopePoint } = this;
    this.previousDynamicCoordinate = this.shapes.map((shape: Point | Line) => {
      return cloneDeep(shape.dynamicCoordinate);
    });
    this.emit(EInternalEvent.ContactDown, point, _prevCurveEndSlopePoint, _nextCurveEndSlopePoint);
  };

  /**
   * 切点移动
   * @description 切点移动时，需要更新切点的控制点
   * @param point
   */
  private _handleContactMove = (point: ControllerPoint) => {
    const { previousDynamicCoordinate, _prevCurveEndSlopePoint, _nextCurveEndSlopePoint } = this;

    this.each((shape, index) => {
      if (shape.name !== 'contact' && previousDynamicCoordinate) {
        shape.coordinate[0].x = axis!.getOriginalX(previousDynamicCoordinate[index][0].x + axis!.distance.x);
        shape.coordinate[0].y = axis!.getOriginalY(previousDynamicCoordinate[index][0].y + axis!.distance.y);

        if (shape instanceof Line) {
          shape.coordinate[1].x = axis!.getOriginalX(previousDynamicCoordinate[index][1].x + axis!.distance.x);
          shape.coordinate[1].y = axis!.getOriginalY(previousDynamicCoordinate[index][1].y + axis!.distance.y);
        }
      }
    });
    this.emit(EInternalEvent.ContactMove, point, _prevCurveEndSlopePoint, _nextCurveEndSlopePoint);
    this.update();
  };

  private _handleContactUp = () => {
    console.log('up');
    this.emit(EInternalEvent.ContactUp);
  };

  private _onControllerPointDown = (_point: ControllerPoint) => {};

  private _onControllerPointMove = (_point: ControllerPoint) => {};

  private _onControllerPointUp = (_point: ControllerPoint) => {};

  public get contactPoint() {
    return this._contactPoint;
  }

  public get prevCurveEndControl() {
    return this._prevCurveEndSlopePoint;
  }

  public get nextCurveStartControl() {
    return this._nextCurveEndSlopePoint;
  }

  public isUnderCursor = this.isShapesUnderCursor;
}
