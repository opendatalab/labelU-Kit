import type { ILabel } from '@labelu/interface';
import Color from 'color';

import { DomPortal } from '@/core/DomPortal';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { AxisPoint } from '../shapes/Point.shape';
import type { Group } from '../shapes';
import { Spline, ShapeText } from '../shapes';
import { LabelBase } from './Label.base';
import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';

export interface PointItem extends AxisPoint {
  id: string;
}

export type LineGroup = Group;

export interface LineData extends BasicImageAnnotation {
  points: PointItem[];
  type: 'line' | 'spline';
  /**
   * 控制点坐标
   * @description 仅在曲线时有效；两两成对，每两个点为一条曲线的控制点
   */
  controlPoints?: AxisPoint[];
}

export class AnnotationLine extends Annotation<LineData, LineStyle> {
  public labelColor: string = LabelBase.DEFAULT_COLOR;

  public strokeColor: string = LabelBase.DEFAULT_COLOR;

  constructor(params: AnnotationParams<LineData, LineStyle>) {
    super(params);
    this.labelColor = AnnotationLine.labelStatic.getLabelColor(params.data.label);
    this.strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();
    this._setupShapes();
    this.group.on(EInternalEvent.MouseOver, this._handleMouseOver);
    this.group.on(EInternalEvent.MouseOut, this._handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);
  }

  static buildLabelMapping(labels: ILabel[]) {
    AnnotationLine.labelStatic = new LabelBase(labels);
  }

  static labelStatic: LabelBase;

  static chunk(arr: any[], size: number) {
    const result = [];

    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }

    return result;
  }

  /**
   * 将扁平的控制点集合转换为分组的控制点集合，开始和结束只有一个控制点，中间有两个控制点
   * @param controlPoints 扁平的控制点集合
   * @returns [ [point], [point, point], ..., [point] ]
   */
  static makeControlPointsByPointList(controlPoints: AxisPoint[]) {
    const result: AxisPoint[][] = [];

    let i = 0;

    while (i < controlPoints.length) {
      if (i === 0) {
        result.push([controlPoints[i]]);
        i += 1;
      } else {
        result.push(controlPoints.slice(i, i + 2));
        i += 2;
      }
    }

    return result;
  }

  private _setupShapes() {
    const { data, group, style, strokeColor } = this;

    const { type, visible = true } = data;

    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    if (type === 'line') {
      for (let i = 1; i < data.points.length; i++) {
        const startPoint = data.points[i - 1];
        const endPoint = data.points[i];

        const line = new Line({
          id: data.points[i - 1].id,
          coordinate: [startPoint, endPoint],
          style: { ...commonStyle, stroke: strokeColor, strokeWidth: Annotation.strokeWidth },
        });

        group.add(line);
      }
    } else if (type === 'spline') {
      // 将控制点分组
      const controlPoints = AnnotationLine.chunk(data.controlPoints!, 2);

      for (let i = 1; i < data.points.length; i++) {
        const startPoint = data.points[i - 1];
        const endPoint = data.points[i];
        const [startControl, endControl] = controlPoints[i - 1];

        const curve = new Spline({
          id: data.points[i - 1].id,
          coordinate: [startPoint, endPoint],
          controlPoints: [{ ...startControl }, { ...endControl }],
          style: { ...commonStyle, stroke: strokeColor, strokeWidth: Annotation.strokeWidth },
        });

        group.add(curve);
      }
    } else {
      throw new Error('Invalid line type!');
    }

    const labelText = AnnotationLine.labelStatic.getLabelText(data.label);
    const attributesText = AnnotationLine.labelStatic.getAttributeTexts(data.label, data.attributes);

    this.doms.push(
      new DomPortal({
        content: this.generateLabelDom(labelText),
        getPosition: (shape, container) => ({
          x: shape.dynamicCoordinate[0].x,
          y: shape.dynamicCoordinate[0].y - container.clientHeight,
        }),
        order: data.order,
        preventPointerEvents: true,
        bindShape: group.shapes[0] as Line,
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
            y: shape.dynamicCoordinate[0].y,
          }),
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
