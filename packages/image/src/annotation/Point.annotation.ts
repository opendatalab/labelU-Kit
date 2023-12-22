import { v4 as uuid } from 'uuid';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Point } from '../shapes/Point.shape';
import type { AxisPoint, PointStyle } from '../shapes/Point.shape';
import { axis } from '../singletons';
import { ShapeText } from '../shapes/Text.shape';
import type { Group } from '../shapes';

export type PointData = BasicImageAnnotation & AxisPoint;

export type PointGroup = Group<Point | ShapeText, PointStyle>;

export class AnnotationPoint extends Annotation<PointData, Point | ShapeText, PointStyle> {
  constructor(params: AnnotationParams<PointData, PointStyle>) {
    super(params);

    this._setupShapes();
  }

  private _setupShapes() {
    const { data, style, group } = this;

    group.add(
      new Point({
        id: data.id,
        coordinate: {
          x: data.x,
          y: data.y,
        },
        style,
      }),
    );

    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: {
          x: data.x,
          y: data.y,
        },
        text: this.getLabelText(),
        style: {
          fill: style.fill!,
          strokeWidth: 0,
        },
      }),
    );
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
