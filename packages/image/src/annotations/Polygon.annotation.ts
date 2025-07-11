import cloneDeep from 'lodash.clonedeep';
import type { ILabel } from '@labelu/interface';
import Color from 'color';

import uid from '@/utils/uid';
import { DomPortal } from '@/core/DomPortal';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { Polygon, type PolygonStyle } from '../shapes/Polygon.shape';
import { AnnotationLine, type PointItem } from './Line.annotation';
import { ClosedSpline, ShapeText } from '../shapes';
import type { Group, AxisPoint } from '../shapes';
import { LabelBase } from './Label.base';
import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';

export interface PolygonData extends BasicImageAnnotation {
  points: PointItem[];
  type: 'line' | 'spline';
  /**
   * 控制点坐标
   * @description 仅在曲线时有效；两两成对，每两个点为一条曲线的控制点
   */
  controlPoints?: AxisPoint[];
}

export type PolygonGroup = Group;

export class AnnotationPolygon extends Annotation<PolygonData, PolygonStyle> {
  public labelColor: string = LabelBase.DEFAULT_COLOR;

  public strokeColor: string = LabelBase.DEFAULT_COLOR;

  constructor(params: AnnotationParams<PolygonData, PolygonStyle>) {
    super(params);

    this.labelColor = AnnotationPolygon.labelStatic.getLabelColor(params.data.label);
    this.strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();

    this._setupShapes();
    this.group.on(EInternalEvent.MouseOver, this._handleMouseOver);
    this.group.on(EInternalEvent.MouseOut, this._handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);
  }

  /**
   * 将扁平的控制点集合转换为以切点为中心的控制点集合
   * @param controlPoints 扁平的控制点集合
   * @returns [ [point, point], [point, point], ..., [point, point] ]
   */
  static makeControlPointsByPointList(controlPoints: AxisPoint[]) {
    // 最后一个控制点在第一个切点的控制杆上
    const lastPoint = controlPoints[controlPoints.length - 1];

    return AnnotationLine.chunk([lastPoint, ...controlPoints.slice(0, controlPoints.length - 1)], 2);
  }

  static buildLabelMapping(labels: ILabel[]) {
    AnnotationPolygon.labelStatic = new LabelBase(labels);
  }

  static labelStatic: LabelBase;

  private _setupShapes() {
    const { data, group, labelColor, strokeColor, style } = this;
    const { visible = true } = data;
    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    if (data.type == 'line') {
      group.add(
        new Polygon({
          id: uid(),
          coordinate: cloneDeep(data.points),
          style: {
            ...commonStyle,
            stroke: strokeColor,
            fill: Color(labelColor).alpha(Annotation.fillOpacity).toString(),
            strokeWidth: Annotation.strokeWidth,
          },
        }),
      );
    } else if (data.type === 'spline') {
      group.add(
        new ClosedSpline({
          id: uid(),
          coordinate: cloneDeep(data.points),
          controlPoints: data.controlPoints!,
          style: {
            ...commonStyle,
            stroke: strokeColor,
            fill: Color(labelColor).alpha(Annotation.fillOpacity).toString(),
            strokeWidth: Annotation.strokeWidth,
          },
        }),
      );
    } else {
      throw Error('Invalid type, only "line" and "spline" are supported');
    }

    const labelText = AnnotationPolygon.labelStatic.getLabelText(data.label);
    const attributesText = AnnotationPolygon.labelStatic.getAttributeTexts(data.label, data.attributes);

    this.doms.push(
      new DomPortal({
        content: this.generateLabelDom(labelText),
        getPosition: (shape, container) => {
          // 找到group中y最小的点
          let point = shape.dynamicCoordinate[0];

          for (const coord of shape.dynamicCoordinate) {
            if (coord.y < point.y) {
              point = coord;
            }
          }

          return {
            x: point.x,
            y: point.y - container.clientHeight - Annotation.strokeWidth - 2,
          };
        },
        order: data.order,
        preventPointerEvents: true,
        bindShape: group.shapes[0],
        style: {
          display: visible ? 'block' : 'none',
        },
      }),
    );

    if (attributesText) {
      this.doms.push(
        new DomPortal({
          content: this.generateAttributeDom(attributesText),
          getPosition: (shape, container) => {
            // 找到group中y最大的点
            let point = shape.dynamicCoordinate[0];

            for (const coord of shape.dynamicCoordinate) {
              if (coord.y > point.y) {
                point = coord;
              }
            }

            return {
              x: point.x,
              y: point.y + container.clientHeight + Annotation.strokeWidth + 2,
            };
          },
          order: data.order,
          preventPointerEvents: true,
          bindShape: group.shapes[0],
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
    const { data, style, group, labelColor, strokeColor } = this;

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
          fill: Color(labelColor).alpha(Annotation.fillOpacity).toString(),
          strokeWidth: Annotation.strokeWidth,
        });
      }
    });
  };

  public getCenter() {
    const { group } = this;

    const maxX = Math.max(...group.shapes[0].dynamicCoordinate.map((item) => item.x));
    const maxY = Math.max(...group.shapes[0].dynamicCoordinate.map((item) => item.y));
    const minX = Math.min(...group.shapes[0].dynamicCoordinate.map((item) => item.x));
    const minY = Math.min(...group.shapes[0].dynamicCoordinate.map((item) => item.y));

    return {
      x: (maxX + minX) / 2,
      y: (maxY + minY) / 2,
    };
  }

  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
