import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { AxisPoint } from '../shapes/Point.shape';
import { BezierCurve } from '../shapes';

export interface PointItem extends AxisPoint {
  id: string;
}

export interface LineData extends BasicImageAnnotation {
  pointList: PointItem[];
  type: 'line' | 'curve';
  /**
   * 控制点坐标
   * @description 仅在曲线时有效；两两成对，每两个点为一条曲线的控制点
   */
  controlPoints?: AxisPoint[];
}

export class AnnotationLine extends Annotation<LineData, Line, LineStyle> {
  constructor(params: AnnotationParams<LineData, LineStyle>) {
    super(params);

    this._setupShapes();
  }

  static chunk(arr: any[], size: number) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }

    return result;
  }

  /**
   * 将扁平的控制点集合转换为分组的控制点集合，开始和结束只有一个控制点，中间有两个控制点
   * @param controlPoints 扁平的控制点集合
   * @returns [ [point], [point, point], ..., [point] ]
   */
  static makeControlPointsByPointList(controlPoints: AxisPoint[]) {
    const result: AxisPoint[][] = [];

    let i = 0;

    while (i < controlPoints.length) {
      if (i === 0) {
        result.push([controlPoints[i]]);
        i += 1;
      } else {
        result.push(controlPoints.slice(i, i + 2));
        i += 2;
      }
    }

    return result;
  }

  private _setupShapes() {
    const { data, group, style } = this;

    if (data.type === 'line') {
      for (let i = 1; i < data.pointList.length; i++) {
        const startPoint = data.pointList[i - 1];
        const endPoint = data.pointList[i];

        const line = new Line({
          id: data.pointList[i - 1].id,
          coordinate: [startPoint, endPoint],
          style,
        });

        group.add(line);
      }
    } else if (data.type === 'curve') {
      // 将控制点分组
      const controlPoints = AnnotationLine.chunk(data.controlPoints!, 2);

      for (let i = 1; i < data.pointList.length; i++) {
        const startPoint = data.pointList[i - 1];
        const endPoint = data.pointList[i];
        const [startControl, endControl] = controlPoints[i - 1];

        const curve = new BezierCurve({
          id: data.pointList[i - 1].id,
          coordinate: [startPoint, endPoint],
          controlPoints: [{ ...startControl }, { ...endControl }],
          style,
        });

        group.add(curve);
      }
    } else {
      throw new Error('Invalid line type!');
    }
  }
}
