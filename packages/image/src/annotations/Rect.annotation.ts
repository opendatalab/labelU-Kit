import type { ILabel } from '@labelu/interface';
import Color from 'color';

import uid from '@/utils/uid';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Rect, type RectStyle } from '../shapes/Rect.shape';
import { ShapeText } from '../shapes/Text.shape';
import type { Group } from '../shapes';
import { LabelBase } from './Label.base';
import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';
import { DomPortal } from '../core/DomPortal';

export interface RectData extends BasicImageAnnotation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RectGroup = Group;

export class AnnotationRect extends Annotation<RectData, RectStyle> {
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
    const { data, group, style, strokeColor } = this;

    const { visible = true } = data;
    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    group.add(
      new Rect({
        id: uid(),
        coordinate: {
          x: data.x,
          y: data.y,
        },
        width: data.width,
        height: data.height,
        style: { ...commonStyle, stroke: strokeColor, strokeWidth: Annotation.strokeWidth },
      }),
    );

    const labelText = AnnotationRect.labelStatic.getLabelText(data.label);
    const attributesText = AnnotationRect.labelStatic.getAttributeTexts(data.label, data.attributes);

    this.doms.push(
      new DomPortal({
        content: this.generateLabelDom(labelText),
        getPosition: (shape, container) => ({
          x: shape.dynamicCoordinate[0].x - Annotation.strokeWidth / 2,
          y: shape.dynamicCoordinate[0].y - container.clientHeight,
        }),
        order: data.order,
        preventPointerEvents: true,
        bindShape: group.shapes[0] as Rect,
        style: {
          display: visible ? 'block' : 'none',
        },
      }),
    );

    if (attributesText) {
      this.doms.push(
        new DomPortal({
          content: this.generateAttributeDom(attributesText),
          getPosition: (shape) => ({
            x: shape.dynamicCoordinate[0].x,
            y: shape.dynamicCoordinate[0].y + (shape as Rect).dynamicHeight + 5,
          }),
          order: data.order,
          preventPointerEvents: true,
          bindShape: group.shapes[0] as Rect,
          style: {
            display: visible ? 'block' : 'none',
          },
        }),
      );
    }
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

  public getCenter() {
    const { group } = this;
    const rect = group.shapes[0] as Rect;
    const sData = rect.serialize();

    return {
      x: rect.dynamicCoordinate[0].x + sData.dynamicWidth / 2,
      y: rect.dynamicCoordinate[0].y + sData.dynamicHeight / 2,
    };
  }

  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
