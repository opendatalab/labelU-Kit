import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Point } from '../shape/Point.shape';
import type { AxisPoint, PointStyle } from '../shape/Point.shape';
import { axis } from '../singletons';

export type PointData = BasicImageAnnotation & AxisPoint;

export class AnnotationPoint extends Annotation<PointData, Point, PointStyle> {
  constructor(params: AnnotationParams<PointData, PointStyle>) {
    super(params);

    this._setupShapes();
  }

  private _setupShapes() {
    const { data, style, group } = this;

    const point = new Point({
      id: data.id,
      coordinate: data,
      style,
    });

    group.add(point);
  }

  public syncCoordToData() {
    const { group, data } = this;

    group.each((shape) => {
      data.x = axis!.getOriginalX(shape.dynamicCoordinate[0].x);
      data.y = axis!.getOriginalY(shape.dynamicCoordinate[0].y);
    });
  }

  public destroy() {
    super.destroy();
  }
}
