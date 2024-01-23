import Color from 'color';
import cloneDeep from 'lodash.clonedeep';

import { Shape } from './Shape';
import type { AxisPoint } from './Point.shape';
import { axis } from '../singletons';
import type { PolygonParams, PolygonStyle } from './Polygon.shape';
import { DEFAULT_LABEL_COLOR } from '../constant';

export interface ClosedSplineParams extends PolygonParams {
  controlPoints: AxisPoint[];
}

export class ClosedSpline extends Shape<PolygonStyle> {
  static DEFAULT_STYLE: Required<PolygonStyle> = {
    stroke: DEFAULT_LABEL_COLOR,
    strokeWidth: 2,
    opacity: 1,
    fill: Color(DEFAULT_LABEL_COLOR).alpha(0.5).toString(),
  };

  private _controlPoints: AxisPoint[];

  private _dynamicControlPoints: AxisPoint[];

  public style: Required<PolygonStyle> = ClosedSpline.DEFAULT_STYLE;

  constructor({ id, controlPoints, coordinate, style }: ClosedSplineParams) {
    super(id, coordinate);

    this._controlPoints = new Proxy(controlPoints, this._coordinateHandler);
    this._dynamicControlPoints = controlPoints;

    if (style) {
      this.style = { ...this.style, ...style };
    }

    // 更新坐标时也更新控制点坐标
    this.onCoordinateChange(() => {
      const { _controlPoints, dynamicCoordinate } = this;

      this._dynamicControlPoints = _controlPoints.map((point) => {
        return axis!.getScaledCoord(point);
      });

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      for (let i = 0; i < dynamicCoordinate.length; i += 1) {
        const { x, y } = dynamicCoordinate[i];

        if (i === 0) {
          minX = maxX = x;
          minY = maxY = y;
        } else {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }

      // TODO: 更新曲线bbox，目前是使用切点组成的bbox
      this.bbox = {
        minX,
        minY,
        maxX,
        maxY,
      };
    });
  }

  public serialize() {
    const { id, style, plainControlPoints, plainCoordinate, dynamicControlPoints, dynamicCoordinate } = this;

    return {
      id,
      coordinate: cloneDeep(plainCoordinate),
      controlPoints: cloneDeep(plainControlPoints),
      dynamicCoordinate,
      dynamicControlPoints,
      style,
    };
  }

  public set controlPoints(coordinate: AxisPoint[]) {
    if (Array.isArray(coordinate)) {
      this._controlPoints = new Proxy(coordinate, this._coordinateHandler);

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

  /**
   * 根据点的索引和方位更新控制点
   * @param index 点的索引
   * @param position 点在曲线上的方位，start为起始控制点，end为结束控制点
   * @param value 点的坐标
   */
  public updateControlPointByPointIndex(index: number, position: 'start' | 'end', value: AxisPoint) {
    if (typeof index !== 'number') {
      throw new Error('Invalid index!');
    }

    if (value.x === undefined || value.y === undefined) {
      throw new Error('Invalid value!');
    }

    const { controlPoints } = this;

    let controlEndIndex = index * 2 - 1;
    let controlStartIndex = index * 2;

    if (index === 0 && position === 'end') {
      if (controlPoints.length === 1) {
        throw new Error('There is only one curve, and the first point cannot find the end control point!');
      }

      controlEndIndex = controlPoints.length - 1;
    }

    if (index === controlPoints.length - 1 && position === 'start') {
      controlStartIndex = 0;
    }

    if (position === 'start') {
      controlPoints[controlStartIndex].x = value.x;
      controlPoints[controlStartIndex].y = value.y;
    } else if (position === 'end') {
      controlPoints[controlEndIndex].x = value.x;
      controlPoints[controlEndIndex].y = value.y;
    } else {
      throw new Error('Invalid position!');
    }
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, dynamicCoordinate, dynamicControlPoints } = this;
    const { stroke, strokeWidth, opacity } = style;
    const [start] = dynamicCoordinate;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.fillStyle = style.fill ?? 'transparent';

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);

    const newCoordinate = [...dynamicCoordinate, start];

    let controlIndex = 0;
    for (let i = 1; i < newCoordinate.length; i += 1) {
      const { x, y } = newCoordinate[i];

      const [controlStart, controlEnd] = dynamicControlPoints.slice(controlIndex, controlIndex + 2);

      ctx.bezierCurveTo(controlStart.x, controlStart.y, controlEnd.x, controlEnd.y, x, y);
      controlIndex += 2;
    }

    ctx.stroke();
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
