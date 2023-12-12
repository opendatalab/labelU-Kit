import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { AxisPoint } from '../shapes/Point.shape';

export interface PointItem extends AxisPoint {
  id: string;
}

export interface LineData extends BasicImageAnnotation {
  pointList: PointItem[];
}

export class AnnotationLine extends Annotation<LineData, Line, LineStyle> {
  constructor(params: AnnotationParams<LineData, LineStyle>) {
    super(params);

    this._setupShapes();
  }

  private _setupShapes() {
    const { data, group, style } = this;

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
  }
}
