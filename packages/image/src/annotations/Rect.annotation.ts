import { v4 as uuid } from 'uuid';
import type { ILabel } from '@labelu/interface';
import Color from 'color';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Rect, type RectStyle } from '../shapes/Rect.shape';
import type { Line } from '../shapes/Line.shape';
import { ShapeText } from '../shapes/Text.shape';
import type { Group } from '../shapes';
import { LabelBase } from './Label.base';
import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';

export interface RectData extends BasicImageAnnotation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RectGroup = Group<Rect | ShapeText, RectStyle>;

export class AnnotationRect extends Annotation<RectData, Line | ShapeText, RectStyle> {
  public labelColor: string = LabelBase.DEFAULT_COLOR;

  constructor(params: AnnotationParams<RectData, RectStyle>) {
    super(params);

    this.labelColor = AnnotationRect.labelStatic.getLabelColor(params.data.label);

    this._setupShapes();
    this.group.on(EInternalEvent.MouseOver, this._handleMouseOver);
    this.group.on(EInternalEvent.MouseOut, this._handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);
  }

  static buildLabelMapping(labels: ILabel[]) {
    AnnotationRect.labelStatic = new LabelBase(labels);
  }

  static labelStatic: LabelBase;

  private _setupShapes() {
    const { data, group, style, labelColor } = this;

    group.add(
      new Rect({
        id: data.id,
        coordinate: {
          x: data.x,
          y: data.y,
        },
        width: data.width,
        height: data.height,
        style: { ...style, stroke: labelColor },
      }),
    );

    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: {
          x: data.x,
          y: data.y + data.height,
        },
        text: `${data.order} ${AnnotationRect.labelStatic.getLabelText(data.label)}`,
        style: {
          fill: labelColor,
        },
      }),
    );
  }

  private _handleMouseOver = () => {
    const { group, style, labelColor, hoveredStyle } = this;

    if (hoveredStyle) {
      group.updateStyle(typeof hoveredStyle === 'function' ? hoveredStyle(style) : hoveredStyle);
    } else {
      group.each((shape) => {
        if (!(shape instanceof ShapeText)) {
          shape.updateStyle({
            stroke: labelColor,
            strokeWidth: style.strokeWidth! + 2,
            fill: Color(labelColor).alpha(0.6).toString(),
          });
        }
      });
    }
  };

  private _handleMouseOut = () => {
    const { group, style, labelColor } = this;

    group.each((shape) => {
      if (!(shape instanceof ShapeText)) {
        shape.updateStyle({
          ...style,
          stroke: labelColor,
        });
      }
    });
  };

  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
