import Color from 'color';

import type { AnnotationParams, PointData } from '../annotations';
import { Annotation, AnnotationPoint } from '../annotations';
import type { AxisPoint, PointStyle, ShapeText } from '../shapes';
import { Point } from '../shapes';
import { Draft } from './Draft';
import type { PointToolOptions } from '../tools';

export class DraftPoint extends Draft<PointData, Point | ShapeText, PointStyle> {
  public config: PointToolOptions;

  constructor(config: PointToolOptions, params: AnnotationParams<PointData, PointStyle>) {
    super({ ...params, name: 'point' });

    this.config = config;
    this.labelColor = AnnotationPoint.labelStatic.getLabelColor(this.data.label);
    this.strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();

    this._setupShapes();

    this.onMouseUp(this._onMouseUp);
  }

  private _setupShapes() {
    const { data, style, group, strokeColor } = this;

    group.add(
      new Point({
        id: data.id,
        coordinate: {
          x: data.x,
          y: data.y,
        },
        style: { ...style, fill: '#fff', strokeWidth: Annotation.strokeWidth, stroke: strokeColor },
      }),
    );
  }

  private _onMouseUp = () => {
    this.syncCoordToData();
  };

  public isUnderCursor(mouseCoord: AxisPoint) {
    return this.group.shapes[0].isUnderCursor(mouseCoord);
  }

  public syncCoordToData(): void {
    const { group, data } = this;

    group.each((shape) => {
      if (shape instanceof Point) {
        data.x = shape.coordinate[0].x;
        data.y = shape.coordinate[0].y;
      }
    });
  }
}
