import type { ILabel } from '@labelu/interface';
import Color from 'color';

import uid from '@/utils/uid';

import type { BasicImageAnnotation } from '../interface';
import type { AnnotationParams } from './Annotation';
import { Annotation } from './Annotation';
import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import type { PointStyle, PolygonStyle, RectStyle } from '../shapes';
import { ShapeText } from '../shapes';
import { LabelBase } from './Label.base';
import { EInternalEvent } from '../enums';
import { axis, eventEmitter } from '../singletons';
import type { PolygonData } from './Polygon.annotation';
import type { RectData } from './Rect.annotation';
import type { PointData } from './Point.annotation';

// 常量定义
const CONSTANTS = {
  MIN_OFFSET_DISTANCE: 16,
  ROTATION_THRESHOLD: 90,
  STROKE_WIDTH_INCREASE: 2,
} as const;

export interface RelationData extends BasicImageAnnotation {
  sourceId: string;
  targetId: string;
}

export type ValidAnnotationType =
  | Annotation<PolygonData, PolygonStyle>
  | Annotation<RectData, RectStyle>
  | Annotation<PointData, PointStyle>;

export interface RelationAnnotationParams extends AnnotationParams<RelationData, LineStyle> {
  getAnnotation: (id: string) => ValidAnnotationType | undefined;
}

export class AnnotationRelation extends Annotation<RelationData, LineStyle> {
  public labelColor: string = LabelBase.DEFAULT_COLOR;
  public strokeColor: string = LabelBase.DEFAULT_COLOR;

  private _getAnnotation: (id: string) => ValidAnnotationType | undefined;

  constructor({ getAnnotation, ...params }: RelationAnnotationParams) {
    super(params);
    this._getAnnotation = getAnnotation;
    this._initializeColors(params.data.label);
    this._setupShapes();
    this._setupEventListeners();
  }

  static buildLabelMapping(labels: ILabel[]) {
    AnnotationRelation.labelStatic = new LabelBase(labels);
  }

  static labelStatic: LabelBase;

  /**
   * 将数组分块
   * @param arr 要分块的数组
   * @param size 每块的大小
   * @returns 分块后的数组
   */
  static chunk<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  /**
   * 初始化颜色
   */
  private _initializeColors(label: string | undefined): void {
    this.labelColor = AnnotationRelation.labelStatic.getLabelColor(label || '');
    this.strokeColor = Color(this.labelColor).alpha(Annotation.strokeOpacity).string();
  }

  /**
   * 设置事件监听器
   */
  private _setupEventListeners(): void {
    this.group.on(EInternalEvent.MouseOver, this._handleMouseOver);
    this.group.on(EInternalEvent.MouseOut, this._handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);
  }

  /**
   * 创建连接线
   */
  private _createConnectionLine(
    sourceCenter: { x: number; y: number },
    targetCenter: { x: number; y: number },
    commonStyle: any,
  ): Line {
    return new Line({
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
      style: {
        ...commonStyle,
        stroke: this.strokeColor,
        strokeWidth: Annotation.strokeWidth,
      },
    });
  }

  /**
   * 获取标注中心点
   */
  private _getAnnotationCenters(): {
    sourceCenter: { x: number; y: number } | null;
    targetCenter: { x: number; y: number } | null;
  } {
    const sourceAnnotation = this._getAnnotation(this.data.sourceId);
    const targetAnnotation = this._getAnnotation(this.data.targetId);

    return {
      sourceCenter: sourceAnnotation?.getCenter() || null,
      targetCenter: targetAnnotation?.getCenter() || null,
    };
  }

  /**
   * 设置形状
   */
  private _setupShapes(): void {
    const { data, group, style } = this;
    const { visible = true } = data;

    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    const { sourceCenter, targetCenter } = this._getAnnotationCenters();

    if (!sourceCenter || !targetCenter) {
      console.error(`无法找到源标注或目标标注: sourceId=${this.data.sourceId}, targetId=${this.data.targetId}`);
      return;
    }

    // 创建连接线
    const line = this._createConnectionLine(sourceCenter, targetCenter, commonStyle);
    group.add(line);

    // 创建标签文本
    const labelText = AnnotationRelation.labelStatic.getLabelText(data.label);
    this.doms.push(
      Annotation.createTextDomPortal(
        this.generateLabelDom(labelText),
        false, // 标签文本在线条下方
        data.order,
        group.shapes[0] as Line,
        {
          display: visible ? 'block' : 'none',
        },
      ),
    );

    const attributesText = AnnotationRelation.labelStatic.getAttributeTexts(data.label, data.attributes);
    if (attributesText) {
      this.doms.push(
        Annotation.createTextDomPortal(
          this.generateAttributeDom(attributesText),
          true, // 属性文本在线条上方
          data.order,
          group.shapes[0] as Line,
          {
            display: visible ? 'block' : 'none',
          },
        ),
      );
    }
  }

  /**
   * 处理鼠标悬停事件
   */
  private _handleMouseOver = (): void => {
    const { data, group, style, hoveredStyle } = this;
    const { visible = true } = data;

    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    if (hoveredStyle) {
      group.updateStyle(typeof hoveredStyle === 'function' ? hoveredStyle(style) : hoveredStyle);
    } else {
      this._updateShapeStyles(group, {
        ...commonStyle,
        stroke: this.strokeColor,
        strokeWidth: Annotation.strokeWidth + CONSTANTS.STROKE_WIDTH_INCREASE,
      });
    }
  };

  /**
   * 处理鼠标离开事件
   */
  private _handleMouseOut = (): void => {
    const { data, style, group } = this;
    const { visible = true } = data;

    const commonStyle = {
      ...style,
      opacity: visible ? 1 : 0,
    };

    this._updateShapeStyles(group, {
      ...commonStyle,
      stroke: this.strokeColor,
      strokeWidth: Annotation.strokeWidth,
    });
  };

  /**
   * 更新形状样式
   */
  private _updateShapeStyles(group: any, style: any): void {
    group.each((shape: any) => {
      if (!(shape instanceof ShapeText)) {
        shape.updateStyle(style);
      }
    });
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    super.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
