import type { BasicImageAnnotation, ToolName } from '../interface';
import { Group } from '../shapes/Group';
import { eventEmitter, monitor } from '../singletons';
import { DEFAULT_LABEL_COLOR } from '../constant';
import type { DomPortal } from '../core/DomPortal';
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
      <div style="color: #fff; font-size: 12px; font-weight: bold; background-color: ${
        this.labelColor
      }; padding: 2px 4px; ${style ?? ''};">
      ${this.showOrder ? this.data.order + ' ' : ''}${text}
      ${extra ?? ''}
      </div>
    `;
  }

  protected generateAttributeDom(text: string, style?: string, extra?: string) {
    return `
      <div style="color: #fff; font-size: 12px; font-weight: bold; background-color: ${
        this.labelColor
      }; padding: 2px 4px; ${style ?? ''};">
      ${text
        .split('\n')
        .map((line) => `<div>${line}</div>`)
        .join('')}
      ${extra ?? ''}
      </div>
    `;
  }
}
