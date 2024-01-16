import { v4 as uuid } from 'uuid';
import type { ILabel } from '@labelu/interface';
import Color from 'color';

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

  private _strokeColor: string = LabelBase.DEFAULT_COLOR;

  constructor(params: AnnotationParams<PointData, PointStyle>) {
    super(params);

    this.labelColor = AnnotationPoint.labelStatic.getLabelColor(params.data.label);
    this._strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();

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
    const { data, style, group, labelColor, _strokeColor } = this;

    group.add(
      new Point({
        id: data.id,
        coordinate: {
          x: data.x,
          y: data.y,
        },
        style: { ...style, fill: labelColor, strokeWidth: Annotation.strokeWidth, stroke: _strokeColor },
      }),
    );

    const attributesText = AnnotationPoint.labelStatic.getLabelTextWithAttributes(data.label, data.attributes);

    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: {
          x: data.x,
          y: data.y,
        },
        text: `${this.showOrder ? data.order + ' ' : ''}${attributesText}`,
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
        stroke: '#fff',
        strokeWidth: Annotation.strokeWidth + 2,
      });
    }
  };

  private _handleMouseOut = () => {
    const { group, labelColor, _strokeColor } = this;

    group.updateStyle({
      fill: labelColor,
      stroke: _strokeColor,
      strokeWidth: Annotation.strokeWidth,
    });
  };

  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
