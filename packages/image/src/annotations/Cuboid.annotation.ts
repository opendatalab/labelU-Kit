import { v4 as uuid } from 'uuid';
import Color from 'color';
import type { ILabel } from '@labelu/interface';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import { type RectStyle } from '../shapes/Rect.shape';
import { ShapeText } from '../shapes/Text.shape';
import { Polygon, type AxisPoint, type Group } from '../shapes';
import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';
import { LabelBase } from './Label.base';

export interface CuboidVertex {
  tl: AxisPoint;
  tr: AxisPoint;
  br: AxisPoint;
  bl: AxisPoint;
}

export type CuboidDirection = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export type CuboidStyle = RectStyle;

export interface CuboidData extends BasicImageAnnotation {
  /**
   * 立体框的方向
   *
   * @description front: 前面，back: 后面，left: 左侧，right: 右侧，top: 顶部，bottom: 底部
   */
  direction: CuboidDirection;
  /**
   * 立体框前面的四个顶点
   */
  front: CuboidVertex;

  /**
   * 立体框后面的四个顶点
   */
  back: CuboidVertex;
}

export type CuboidGroup = Group<Polygon | ShapeText, CuboidStyle>;

export class AnnotationCuboid extends Annotation<CuboidData, Polygon | ShapeText, CuboidStyle> {
  private _realFront: Polygon | null = null;

  public labelColor: string = LabelBase.DEFAULT_COLOR;

  private _strokeColor: string = LabelBase.DEFAULT_COLOR;

  constructor(params: AnnotationParams<CuboidData, CuboidStyle>) {
    super(params);

    this.labelColor = AnnotationCuboid.labelStatic.getLabelColor(params.data.label);
    this._strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();

    this._setupShapes();
    this.group.on(EInternalEvent.MouseOver, this._handleMouseOver);
    this.group.on(EInternalEvent.MouseOut, this._handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);
  }

  static buildLabelMapping(labels: ILabel[]) {
    AnnotationCuboid.labelStatic = new LabelBase(labels);
  }

  static labelStatic: LabelBase;

  /**
   * 生成立体框正面的四个点坐标
   *
   * @description 根据立体框的方向，生成对应的四个点坐标
   * @param data 立体框数据
   * @returns 立体框正面的四个点坐标
   * - 正面，点顺序为 ftl -> ftr -> fbr -> fbl
   * - 后面，点顺序为 btl -> btr -> bbr -> bbl
   * - 左侧，点顺序为 ftl -> btl -> bbl -> fbl
   * - 右侧，点顺序为 ftr -> btr -> bbr -> fbr
   * - 顶部，点顺序为 ftl -> ftr -> btr -> btl
   * - 底部，点顺序为 fbl -> fbr -> bbr -> bbl
   *
   * @throws {Error} 当方向不合法时抛出异常
   */
  static generateFrontCoordinate(data: CuboidData) {
    const { front, back, direction } = data;

    if (direction === 'front') {
      return [front.tl, front.tr, front.br, front.bl];
    } else if (direction === 'back') {
      return [back.tl, back.tr, back.br, back.bl];
    } else if (direction === 'left') {
      return [front.tl, back.tl, back.bl, front.bl];
    } else if (direction === 'right') {
      return [front.tr, back.tr, back.br, front.br];
    } else if (direction === 'top') {
      return [front.tl, front.tr, back.tr, back.tl];
    } else if (direction === 'bottom') {
      return [front.bl, front.br, back.br, back.bl];
    } else {
      throw new Error('Invalid direction!');
    }
  }

  private _handleMouseOver = () => {
    const { data, group, style, labelColor, hoveredStyle, _strokeColor } = this;

    const { visible = true } = data;

    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    if (hoveredStyle) {
      group.updateStyle(typeof hoveredStyle === 'function' ? hoveredStyle(style) : hoveredStyle);
    } else {
      group.each((shape) => {
        if (shape === this._realFront) {
          shape.updateStyle({
            ...commonStyle,
            fill: Color(labelColor).alpha(Annotation.fillOpacity).string(),
          });
        } else if (!(shape instanceof ShapeText)) {
          shape.updateStyle({
            ...commonStyle,
            stroke: _strokeColor,
            strokeWidth: Annotation.strokeWidth + 2,
          });
        }
      });
    }
  };

  private _handleMouseOut = () => {
    const { style, data, group, labelColor, _strokeColor } = this;

    const { visible = true } = data;

    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    group.each((shape) => {
      if (shape === this._realFront) {
        shape.updateStyle({
          ...commonStyle,
          fill: Color(labelColor).alpha(Annotation.fillOpacity).string(),
        });
      } else if (!(shape instanceof ShapeText)) {
        shape.updateStyle({
          ...commonStyle,
          stroke: _strokeColor,
          strokeWidth: Annotation.strokeWidth,
        });
      }
    });
  };

  /**
   * 一个静止的立体框由6个边框四边形 + 1个背景色四边形组成
   */
  private _setupShapes() {
    const { data, group, style, labelColor, _strokeColor } = this;
    const { front, back, visible = true } = data;

    const frontCoordinate = AnnotationCuboid.generateFrontCoordinate(data);

    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    const realFront = new Polygon({
      id: uuid(),
      coordinate: frontCoordinate,
      style: {
        ...commonStyle,
        stroke: 'transparent',
        strokeWidth: 0,
        fill: Color(labelColor).alpha(Annotation.fillOpacity).string(),
      },
    });

    this._realFront = realFront;

    group.add(
      // 背景色
      realFront,
      // 前面的矩形（非真实的前面）
      new Polygon({
        id: uuid(),
        coordinate: [front.tl, front.tr, front.br, front.bl],
        style: { ...commonStyle, stroke: _strokeColor, strokeWidth: Annotation.strokeWidth },
      }),
      // 后面的矩形（非真实的前面）
      new Polygon({
        id: uuid(),
        coordinate: [back.tl, back.tr, back.br, back.bl],
        style: { ...commonStyle, stroke: _strokeColor, strokeWidth: Annotation.strokeWidth },
      }),
      // 平行四边形
      new Polygon({
        id: uuid(),
        coordinate: [front.tl, front.tr, back.tr, back.tl],
        style: { ...commonStyle, stroke: _strokeColor, strokeWidth: Annotation.strokeWidth, fill: 'transparent' },
      }),
      new Polygon({
        id: uuid(),
        coordinate: [front.tr, front.br, back.br, back.tr],
        style: { ...commonStyle, stroke: _strokeColor, strokeWidth: Annotation.strokeWidth, fill: 'transparent' },
      }),
      new Polygon({
        id: uuid(),
        coordinate: [front.br, front.bl, back.bl, back.br],
        style: { ...commonStyle, stroke: _strokeColor, strokeWidth: Annotation.strokeWidth, fill: 'transparent' },
      }),
      new Polygon({
        id: uuid(),
        coordinate: [front.bl, front.tl, back.tl, back.bl],
        style: { ...commonStyle, stroke: _strokeColor, strokeWidth: Annotation.strokeWidth, fill: 'transparent' },
      }),
    );

    const attributesText = AnnotationCuboid.labelStatic.getLabelTextWithAttributes(data.label, data.attributes);

    // label
    group.add(
      new ShapeText({
        id: uuid(),
        coordinate: {
          x: front.bl.x,
          y: front.bl.y,
        },
        text: `${this.showOrder ? data.order + ' ' : ''}${attributesText}`,
        style: {
          opacity: visible ? 1 : 0,
          fill: labelColor,
        },
      }),
    );
  }

  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
