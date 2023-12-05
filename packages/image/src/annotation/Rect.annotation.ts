import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Rect, type RectStyle } from '../shapes/Rect.shape';
import type { Line } from '../shapes/Line.shape';

export interface RectData extends BasicImageAnnotation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AnnotationRect extends Annotation<RectData, Line, RectStyle> {
  constructor(params: AnnotationParams<RectData, RectStyle>) {
    super(params);

    this._setupShapes();
  }

  private _setupShapes() {
    const { data, group, style } = this;

    group.add(
      new Rect({
        id: data.id,
        coordinate: {
          x: data.x,
          y: data.y,
        },
        width: data.width,
        height: data.height,
        style,
      }),
    );
  }
}
