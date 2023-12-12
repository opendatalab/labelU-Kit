import cloneDeep from 'lodash.clonedeep';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Polygon, type PolygonStyle } from '../shapes/Polygon.shape';
import type { PointItem } from './Line.annotation';

export interface PolygonData extends BasicImageAnnotation {
  pointList: PointItem[];
}

export class AnnotationPolygon extends Annotation<PolygonData, Polygon, PolygonStyle> {
  constructor(params: AnnotationParams<PolygonData, PolygonStyle>) {
    super(params);

    this._setupShapes();
  }

  private _setupShapes() {
    const { data, group, style } = this;

    group.add(
      new Polygon({
        id: data.id,
        coordinate: cloneDeep(data.pointList),
        style,
      }),
    );
  }
}
