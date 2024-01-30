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

  public strokeColor: string = LabelBase.DEFAULT_COLOR;

  constructor(params: AnnotationParams<RectData, RectStyle>) {
    super(params);

    this.labelColor = AnnotationRect.labelStatic.getLabelColor(params.data.label);
    this.strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();

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
    const { data, group, style, labelColor, strokeColor } = this;

    const { visible = true } = data;
    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    group.add(
      new Rect({
        id: uuid(),
        coordinate: {
          x: data.x,
          y: data.y,
        },
        width: data.width,
        height: data.height,
        style: { ...commonStyle, stroke: strokeColor, strokeWidth: Annotation.strokeWidth },
      }),
    );

    const attributesText = AnnotationRect.labelStatic.getLabelTextWithAttributes(data.label, data.attributes);

    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: {
          x: data.x,
          y: data.y + data.height,
        },
        text: `${this.showOrder ? data.order + ' ' : ''}${attributesText}`,
        style: {
          opacity: visible ? 1 : 0,
          fill: labelColor,
        },
      }),
    );
  }

  private _handleMouseOver = () => {
    const { data, group, style, labelColor, hoveredStyle, strokeColor } = this;

    const { visible = true } = data;
    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    if (hoveredStyle) {
      group.updateStyle(typeof hoveredStyle === 'function' ? hoveredStyle(style) : hoveredStyle);
    } else {
      group.each((shape) => {
        if (!(shape instanceof ShapeText)) {
          shape.updateStyle({
            ...commonStyle,
            stroke: strokeColor,
            strokeWidth: Annotation.strokeWidth + 2,
            fill: Color(labelColor).alpha(Annotation.fillOpacity).toString(),
          });
        }
      });
    }
  };

  private _handleMouseOut = () => {
    const { data, style, group, strokeColor } = this;

    const { visible = true } = data;
    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    group.each((shape) => {
      if (!(shape instanceof ShapeText)) {
        shape.updateStyle({
          ...commonStyle,
          stroke: strokeColor,
          strokeWidth: Annotation.strokeWidth,
        });
      }
    });
  };

  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
