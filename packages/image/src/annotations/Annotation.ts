import type { Line } from '../shapes';
import type { BasicImageAnnotation, ToolName } from '../interface';
import { Group } from '../shapes/Group';
import { eventEmitter, monitor } from '../singletons';
import { DEFAULT_LABEL_COLOR } from '../constant';
import { DomPortal } from '../core/DomPortal';
import { EInternalEvent } from '../enums/internalEvent.enum';

// TODO: 去除本类的any
export interface AnnotationParams<Data extends BasicImageAnnotation, Style> {
  id: string;
  data: Data;
  name: ToolName;
  style: Style;
  hoveredStyle?: Style | ((style: Style) => Style);

  /**
   * 是否显示标注顺序
   *
   * @default false
   */
  showOrder: boolean;
  onMove?: (e: MouseEvent, annotation: any) => void;
  onMoveEnd?: (e: MouseEvent, annotation: any) => void;
  onPick?: (e: MouseEvent, annotation: any) => void;
}

export interface TextPositionParams {
  shape: Line;
  container: HTMLElement;
  isAboveLine: boolean;
}

export interface TextPosition {
  x: number;
  y: number;
  rotate: number;
}

export class Annotation<Data extends BasicImageAnnotation, Style> {
  public id: string;

  public doms: DomPortal[] = [];

  public data: Data;

  public name: ToolName;

  public style: Style;

  public group: Group;

  public hoveredStyle?: Style | ((style: Style) => Style);

  public showOrder: boolean = false;

  public labelColor: string = DEFAULT_LABEL_COLOR;

  public strokeColor: string = DEFAULT_LABEL_COLOR;

  static strokeOpacity = 0.9;

  static fillOpacity = 0.7;

  static strokeWidth = 2;

  static minOffsetDistance = 14;

  static rotationThreshold = 90;

  static calculateTextPosition({ shape, container, isAboveLine }: TextPositionParams): TextPosition {
    const { angle, rotate, centerX, centerY } = shape.getLineInfo();

    // 根据角度决定偏移方向
    let perpendicularAngle: number;
    if (Math.abs(rotate) <= Annotation.rotationThreshold) {
      // 角度在-90到90度之间
      perpendicularAngle = isAboveLine ? angle + Math.PI / 2 : angle - Math.PI / 2;
    } else {
      // 角度超过90度
      perpendicularAngle = isAboveLine ? angle - Math.PI / 2 : angle + Math.PI / 2;
    }

    const offsetDistance = Annotation.minOffsetDistance;
    const x = centerX + Math.cos(perpendicularAngle) * offsetDistance - container.clientWidth / 2;
    const y = centerY + Math.sin(perpendicularAngle) * offsetDistance - container.clientHeight / 2;

    // 根据角度调整旋转，确保文字始终可读
    let finalRotate = rotate;
    if (Math.abs(rotate) > Annotation.rotationThreshold) {
      finalRotate = rotate + 180;
    }

    return { x, y, rotate: finalRotate };
  }

  static createTextDomPortal(
    content: string,
    isAboveLine: boolean,
    order: number,
    bindShape: Line,
    style?: Record<string, string>,
  ): DomPortal {
    return new DomPortal({
      content,
      getPosition: (shape, container) =>
        Annotation.calculateTextPosition({ shape: shape as Line, container, isAboveLine }),
      order,
      preventPointerEvents: true,
      bindShape,
      style,
    });
  }

  public get isHovered() {
    return false;
  }

  constructor({ id, data, style, hoveredStyle, showOrder, name }: AnnotationParams<Data, Style>) {
    this.id = id;
    this.data = data;
    this.style = style;
    this.hoveredStyle = hoveredStyle;
    this.showOrder = showOrder;
    this.name = name;
    this.group = new Group(id, data.order);

    // 建立order和id的映射关系
    monitor?.setOrderIndexedAnnotationIds(data.order, id);

    this.group.on(EInternalEvent.MouseOver, this.__handleMouseOver);
    this.group.on(EInternalEvent.MouseOut, this.__handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this.__handleMouseOut);
  }

  private __handleMouseOver = () => {
    this.doms.forEach((dom) => dom.toTop());
  };

  private __handleMouseOut = () => {
    this.doms.forEach((dom) => dom.resetZIndex());
  };

  public get bbox() {
    return this.group.bbox;
  }

  public getCenter() {
    const width = this.bbox.maxX - this.bbox.minX;
    const height = this.bbox.maxY - this.bbox.minY;

    return {
      x: this.bbox.minX + width / 2,
      y: this.bbox.minY + height / 2,
    };
  }

  public render(_ctx: CanvasRenderingContext2D) {
    this.group.render(_ctx);
  }

  public destroy() {
    this.doms.forEach((dom) => dom.destroy());
    this.data = null as any;
    this.group.destroy();
    this.group.off(EInternalEvent.MouseOver, this.__handleMouseOver);
    this.group.off(EInternalEvent.MouseOut, this.__handleMouseOut);
    eventEmitter.off(EInternalEvent.NoTarget, this.__handleMouseOut);
  }

  protected generateLabelDom(text: string, style?: string, extra?: string) {
    return `
      <div style="color: #fff; font-size: 12px; background-color: ${this.labelColor}; padding: 1px 2px; ${
      style ?? ''
    };">
      ${this.showOrder ? this.data.order + ' ' : ''}${text}
      ${extra ?? ''}
      </div>
    `;
  }

  protected generateAttributeDom(text: string, style?: string, extra?: string) {
    return `
      <div style="color: #fff; font-size: 12px; max-width: 16em; background-color: ${
        this.labelColor
      }; padding: 1px 2px; ${style ?? ''};">
      ${text
        .split('\n')
        .map((line) => `<div>${line}</div>`)
        .join('')}
      ${extra ?? ''}
      </div>
    `;
  }
}
