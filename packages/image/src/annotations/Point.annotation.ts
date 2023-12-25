import { v4 as uuid } from 'uuid';
import type { ILabel } from '@labelu/interface';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Point } from '../shapes/Point.shape';
import type { AxisPoint, PointStyle } from '../shapes/Point.shape';
import { eventEmitter } from '../singletons';
import { ShapeText } from '../shapes/Text.shape';
import type { Group } from '../shapes';
import { LabelBase } from './Label.base';
import { EInternalEvent } from '../enums';

export type PointData = BasicImageAnnotation & AxisPoint;

export type PointGroup = Group<Point | ShapeText, PointStyle>;

export class AnnotationPoint extends Annotation<PointData, Point | ShapeText, PointStyle> {
  public labelColor: string = LabelBase.DEFAULT_COLOR;

  constructor(params: AnnotationParams<PointData, PointStyle>) {
    super(params);

    this.labelColor = AnnotationPoint.labelStatic.getLabelColor(params.data.label);

    this._setupShapes();
    this.group.on(EInternalEvent.MouseOver, this._handleMouseOver);
    this.group.on(EInternalEvent.MouseOut, this._handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);
  }

  static buildLabelMapping(labels: ILabel[]) {
    AnnotationPoint.labelStatic = new LabelBase(labels);
  }

  static labelStatic: LabelBase;

  private _setupShapes() {
    const { data, style, group, labelColor } = this;

    group.add(
      new Point({
        id: data.id,
        coordinate: {
          x: data.x,
          y: data.y,
        },
        style: { ...style, fill: labelColor },
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

  private _handleMouseOver = () => {
    const { group, style, hoveredStyle } = this;

    if (hoveredStyle) {
      group.updateStyle(typeof hoveredStyle === 'function' ? hoveredStyle(style) : hoveredStyle);
    } else {
      group.updateStyle({
        fill: '#fff',
        stroke: '#000',
        strokeWidth: 2,
      });
    }
  };

  private _handleMouseOut = () => {
    const { group, labelColor } = this;

    group.updateStyle({
      fill: labelColor,
    });
  };

  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
