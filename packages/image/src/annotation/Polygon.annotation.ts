import cloneDeep from 'lodash.clonedeep';
import { v4 as uuid } from 'uuid';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Polygon, type PolygonStyle } from '../shapes/Polygon.shape';
import { AnnotationLine, type PointItem } from './Line.annotation';
import { ClosedSpline, type AxisPoint, ShapeText } from '../shapes';

export interface PolygonData extends BasicImageAnnotation {
  pointList: PointItem[];
  type: 'line' | 'spline';
  /**
   * 控制点坐标
   * @description 仅在曲线时有效；两两成对，每两个点为一条曲线的控制点
   */
  controlPoints?: AxisPoint[];
}

export class AnnotationPolygon extends Annotation<PolygonData, Polygon, PolygonStyle> {
  constructor(params: AnnotationParams<PolygonData, PolygonStyle>) {
    super(params);

    this._setupShapes();
  }

  /**
   * 将扁平的控制点集合转换为以切点为中心的控制点集合
   * @param controlPoints 扁平的控制点集合
   * @returns [ [point, point], [point, point], ..., [point, point] ]
   */
  static makeControlPointsByPointList(controlPoints: AxisPoint[]) {
    // 最后一个控制点在第一个切点的控制杆上
    const lastPoint = controlPoints[controlPoints.length - 1];

    return AnnotationLine.chunk([lastPoint, ...controlPoints.slice(0, controlPoints.length - 1)], 2);
  }

  private _setupShapes() {
    const { data, group, style } = this;

    if (data.type == 'line') {
      group.add(
        new Polygon({
          id: data.id,
          coordinate: cloneDeep(data.pointList),
          style,
        }),
      );
    } else if (data.type === 'spline') {
      group.add(
        new ClosedSpline({
          id: data.id,
          coordinate: cloneDeep(data.pointList),
          controlPoints: data.controlPoints!,
          style,
        }),
      );
    } else {
      throw Error('Invalid type, only "line" and "spline" are supported');
    }

    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: data.pointList[0],
        text: this.getLabelText(),
        style: {
          // TODO: 注意undefined的情况
          fill: style.stroke!,
          strokeWidth: 0,
        },
      }),
    );
  }
}
