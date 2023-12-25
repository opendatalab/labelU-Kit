import { v4 as uuid } from 'uuid';

import type { AnnotationParams, PointData } from '../annotations';
import { Annotation, AnnotationPoint } from '../annotations';
import type { AxisPoint, PointStyle } from '../shapes';
import { Point, ShapeText } from '../shapes';
import { DraftObserverMixin } from './DraftObserver';
import type { PointToolOptions } from '../tools';

export class DraftPoint extends DraftObserverMixin(Annotation<PointData, Point | ShapeText, PointStyle>) {
  public config: PointToolOptions;

  private _pickedCoordinate: AxisPoint | null = null;

  constructor(config: PointToolOptions, params: AnnotationParams<PointData, PointStyle>) {
    super(params);

    this.config = config;
    this.labelColor = AnnotationPoint.labelStatic.getLabelColor(this.data.label);

    this._setupShapes();

    this.onMouseUp(this._onMouseUp);
  }

  private _setupShapes() {
    const { data, style, group, labelColor } = this;

    group.add(
      new Point({
        id: data.id,
        coordinate: {
          x: data.x,
          y: data.y,
        },
        style: { ...style, fill: '#fff', strokeWidth: 4, stroke: labelColor },
      }),
    );

    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: {
          x: data.x,
          y: data.y,
        },
        text: `${data.order} ${AnnotationPoint.labelStatic.getLabelText(data.label)}`,
        style: {
          fill: labelColor,
        },
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
