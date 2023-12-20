import { v4 as uuid } from 'uuid';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Rect, type RectStyle } from '../shapes/Rect.shape';
import type { Line } from '../shapes/Line.shape';
import { ShapeText } from '../shapes/Text.shape';

export interface RectData extends BasicImageAnnotation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AnnotationRect extends Annotation<RectData, Line | ShapeText, RectStyle> {
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

    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: {
          x: data.x,
          y: data.y + data.height,
        },
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
