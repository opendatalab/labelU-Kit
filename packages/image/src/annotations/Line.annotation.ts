import { v4 as uuid } from 'uuid';
import type { ILabel } from '@labelu/interface';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { AxisPoint } from '../shapes/Point.shape';
import type { Group, TextStyle } from '../shapes';
import { Spline, ShapeText } from '../shapes';
import { LabelBase } from './Label.base';
import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';

export interface PointItem extends AxisPoint {
  id: string;
}

export type LineGroup = Group<Line | ShapeText, LineStyle>;

export interface LineData extends BasicImageAnnotation {
  points: PointItem[];
  type: 'line' | 'spline';
  /**
   * 控制点坐标
   * @description 仅在曲线时有效；两两成对，每两个点为一条曲线的控制点
   */
  controlPoints?: AxisPoint[];
}

export class AnnotationLine extends Annotation<LineData, Line | ShapeText, LineStyle | TextStyle> {
  public labelColor: string = LabelBase.DEFAULT_COLOR;

  constructor(params: AnnotationParams<LineData, LineStyle>) {
    super(params);
    this.labelColor = AnnotationLine.labelStatic.getLabelColor(params.data.label);
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
    const { data, group, style, labelColor } = this;

    if (data.type === 'line') {
      for (let i = 1; i < data.points.length; i++) {
        const startPoint = data.points[i - 1];
        const endPoint = data.points[i];

        const line = new Line({
          id: data.points[i - 1].id,
          coordinate: [startPoint, endPoint],
          style: { ...style, stroke: labelColor },
        });

        group.add(line);
      }
    } else if (data.type === 'spline') {
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
          style: { ...style, stroke: labelColor },
        });

        group.add(curve);
      }
    } else {
      throw new Error('Invalid line type!');
    }

    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: data.points[0],
        text: `${data.order} ${AnnotationLine.labelStatic.getLabelText(data.label)}`,
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
        strokeWidth: style.strokeWidth! + 2,
      });
    }
  };

  private _handleMouseOut = () => {
    const { group, style } = this;

    group.updateStyle({
      strokeWidth: style.strokeWidth,
    });
  };

  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
