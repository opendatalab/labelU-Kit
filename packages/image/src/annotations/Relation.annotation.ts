import type { ILabel } from '@labelu/interface';
import Color from 'color';

import uid from '@/utils/uid';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { Point, PointStyle, Polygon, PolygonStyle, Rect, RectStyle, TextStyle } from '../shapes';
import { ShapeText } from '../shapes';
import { LabelBase } from './Label.base';
import { EInternalEvent } from '../enums';
import { axis, eventEmitter } from '../singletons';
import type { PolygonData } from './Polygon.annotation';
import type { RectData } from './Rect.annotation';
import type { PointData } from './Point.annotation';

export interface RelationData extends BasicImageAnnotation {
  sourceId: string;
  targetId: string;
}

export type ValidAnnotationType =
  | Annotation<PolygonData, Polygon | ShapeText, PolygonStyle>
  | Annotation<RectData, Rect | ShapeText, RectStyle>
  | Annotation<PointData, Point | ShapeText, PointStyle>;

export interface RelationAnnotationParams extends AnnotationParams<RelationData, LineStyle> {
  getAnnotation: (id: string) => ValidAnnotationType | undefined;
}

export class AnnotationRelation extends Annotation<RelationData, Line | ShapeText, LineStyle | TextStyle> {
  public labelColor: string = LabelBase.DEFAULT_COLOR;

  public strokeColor: string = LabelBase.DEFAULT_COLOR;

  private _getAnnotation: (id: string) => ValidAnnotationType | undefined;

  constructor({ getAnnotation, ...params }: RelationAnnotationParams) {
    super(params);
    this._getAnnotation = getAnnotation;
    this.labelColor = AnnotationRelation.labelStatic.getLabelColor(params.data.label);
    this.strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();
    this._setupShapes();
    this.group.on(EInternalEvent.MouseOver, this._handleMouseOver);
    this.group.on(EInternalEvent.MouseOut, this._handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);
  }

  static buildLabelMapping(labels: ILabel[]) {
    AnnotationRelation.labelStatic = new LabelBase(labels);
  }

  static labelStatic: LabelBase;

  static chunk(arr: any[], size: number) {
    const result = [];

    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }

    return result;
  }

  private _setupShapes() {
    const { data, group, style, labelColor, strokeColor } = this;

    const { visible = true } = data;

    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    const sourceAnnotation = this._getAnnotation(data.sourceId);
    const targetAnnotation = this._getAnnotation(data.targetId);
    const sourceCenter = sourceAnnotation?.getCenter();
    const targetCenter = targetAnnotation?.getCenter();

    if (!sourceCenter || !targetCenter) {
      console.error('sourceAnnotation or targetAnnotation is not found');
      return;
    }

    const line = new Line({
      id: uid(),
      coordinate: [
        {
          x: axis!.getOriginalX(sourceCenter.x),
          y: axis!.getOriginalY(sourceCenter.y),
        },
        {
          x: axis!.getOriginalX(targetCenter.x),
          y: axis!.getOriginalY(targetCenter.y),
        },
      ],
      style: { ...commonStyle, stroke: strokeColor, strokeWidth: Annotation.strokeWidth },
    });

    group.add(line);

    const attributesText = AnnotationRelation.labelStatic.getLabelTextWithAttributes(data.label, data.attributes);

    group.add(
      new ShapeText({
        id: uid(),
        // 线段的中点
        coordinate: {
          x: axis!.getOriginalX((sourceCenter.x + targetCenter.x) / 2),
          y: axis!.getOriginalY((sourceCenter.y + targetCenter.y) / 2),
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
    const { data, group, style, hoveredStyle, strokeColor } = this;

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
