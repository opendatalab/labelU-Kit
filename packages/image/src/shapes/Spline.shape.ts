import cloneDeep from 'lodash.clonedeep';

import { Shape } from './Shape';
import type { AxisPoint } from './Point.shape';
import type { LineParams, LineStyle } from './Line.shape';
import { axis } from '../singletons';
import { DEFAULT_LABEL_COLOR } from '../constant';

export interface CurveParams extends LineParams {
  controlPoints: [AxisPoint, AxisPoint];
}

export class Spline extends Shape<LineStyle> {
  static DEFAULT_STYLE: Required<LineStyle> = {
    stroke: DEFAULT_LABEL_COLOR,
    strokeWidth: 2,
    opacity: 1,
  };

  private _controlPoints: [AxisPoint, AxisPoint];

  private _dynamicControlPoints: [AxisPoint, AxisPoint];

  public style: Required<LineStyle> = Spline.DEFAULT_STYLE;

  constructor({ id, controlPoints, coordinate, style }: CurveParams) {
    super(id, coordinate);

    this._controlPoints = new Proxy(controlPoints, this._coordinateHandler) as [AxisPoint, AxisPoint];
    this._dynamicControlPoints = controlPoints;

    if (style) {
      this.style = { ...this.style, ...style };
    }

    // 更新坐标时也更新控制点坐标
    this.onCoordinateChange(() => {
      const { _controlPoints } = this;

      this._dynamicControlPoints = _controlPoints.map((point) => {
        return axis!.getScaledCoord(point);
      }) as [AxisPoint, AxisPoint];

      const [start, end] = this.dynamicCoordinate;
      const [controlStart, controlEnd] = this.dynamicControlPoints;

      // TODO: 更新曲线bbox，目前是使用切点 + 控制点标组成的bbox
      this.bbox = {
        minX: Math.min(start.x, end.x, controlStart.x, controlEnd.x),
        minY: Math.min(start.y, end.y, controlStart.y, controlEnd.y),
        maxX: Math.max(start.x, end.x, controlStart.x, controlEnd.x),
        maxY: Math.max(start.y, end.y, controlStart.y, controlEnd.y),
      };
    });
  }

  public serialize() {
    const { id, style, plainCoordinate, plainControlPoints, dynamicControlPoints, dynamicCoordinate } = this;

    return {
      id,
      coordinate: cloneDeep(plainCoordinate),
      dynamicCoordinate: cloneDeep(dynamicCoordinate),
      controlPoints: cloneDeep(plainControlPoints),
      dynamicControlPoints: cloneDeep(dynamicControlPoints),
      style,
    };
  }

  public set controlPoints(coordinate: [AxisPoint, AxisPoint]) {
    if (Array.isArray(coordinate)) {
      this._controlPoints = new Proxy(coordinate, this._coordinateHandler) as [AxisPoint, AxisPoint];

      this.update();
    } else {
      throw new Error('coordinate must be an array of AxisPoint!');
    }
  }

  public get controlPoints() {
    return this._controlPoints;
  }

  public get plainControlPoints() {
    return this._controlPoints.map((point) => {
      return {
        x: point.x,
        y: point.y,
      };
    });
  }

  public get dynamicControlPoints() {
    return this._dynamicControlPoints;
  }

  /**
   * TODO：曲线是否在鼠标指针下
   *
   * @param mouseCoord 鼠标坐标
   */
  public isUnderCursor(_mouseCoord: AxisPoint) {
    const { bbox } = this;

    return (
      bbox.maxX > _mouseCoord.x && bbox.minX < _mouseCoord.x && bbox.maxY > _mouseCoord.y && bbox.minY < _mouseCoord.y
    );
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, dynamicCoordinate, dynamicControlPoints } = this;
    const { stroke, strokeWidth, opacity } = style;
    const [start, end] = dynamicCoordinate;
    const [controlStart, controlEnd] = dynamicControlPoints;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(controlStart.x, controlStart.y, controlEnd.x, controlEnd.y, end.x, end.y);

    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
