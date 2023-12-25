import type { BasicImageAnnotation } from '../interface';
import { Group } from '../shapes/Group';
import { type Shape } from '../shapes';
import { EInternalEvent } from '../enums';
import { axis, eventEmitter, monitor } from '../singletons';

// TODO: 去除本类的any
export interface AnnotationParams<Data extends BasicImageAnnotation, Style> {
  id: string;
  data: Data;
  style: Style;
  hoveredStyle?: Style | ((style: Style) => Style);

  /**
   * 是否显示标注顺序
   *
   * @default false
   */
  showOrder: boolean;
  onSelect?: (e: MouseEvent, annotation: any) => void;
  onUnSelect?: (e: MouseEvent, annotation: any) => void;
  onMove?: (e: MouseEvent, annotation: any) => void;
  onMoveEnd?: (e: MouseEvent, annotation: any) => void;
  onPick?: (e: MouseEvent, annotation: any) => void;
}

export class Annotation<Data extends BasicImageAnnotation, IShape extends Shape<Style>, Style> {
  public id: string;

  public data: Data;

  public style: Style;

  public group: Group<IShape, Style>;

  public hoveredStyle?: Style | ((style: Style) => Style);

  public showOrder: boolean = false;

  public eventHandlers: {
    onBBoxOver?: (e: MouseEvent, annotation: any) => void;
    onBBoxOut?: (e: MouseEvent, annotation: any) => void;
    onSelect?: (e: MouseEvent, annotation: any) => void;
    onUnSelect?: (e: MouseEvent, annotation: any) => void;
    onMove?: (e: MouseEvent, annotation: any) => void;
    onMoveEnd?: (e: MouseEvent, annotation: any) => void;
    onPick?: (e: MouseEvent, annotation: any) => void;
  };

  public get isHovered() {
    return false;
  }

  constructor({
    id,
    data,
    style,
    hoveredStyle,
    showOrder,
    onSelect,
    onUnSelect,
    onMove,
    onMoveEnd,
    onPick,
  }: AnnotationParams<Data, Style>) {
    this.id = id;
    this.data = data;
    this.style = style;
    this.hoveredStyle = hoveredStyle;
    this.showOrder = showOrder;

    this.eventHandlers = {
      onSelect,
      onUnSelect,
      onMove,
      onMoveEnd,
      onPick,
    };

    this.group = new Group(id, data.order);

    eventEmitter.on(EInternalEvent.Select, this._handleSelect);
    eventEmitter.on(EInternalEvent.UnSelect, this._handleUnSelect);

    // 建立order和id的映射关系
    monitor?.setOrderIndexedAnnotationIds(data.order, id);
  }

  private _handleSelect = (e: MouseEvent, id: string) => {
    // 正在移动过程中的右键不处理
    if (id !== this.id || axis?.isMoved) {
      return;
    }

    const { onSelect } = this.eventHandlers;
    if (onSelect) {
      onSelect(e, this);
    } else {
      console.warn('Implement me!');
    }
  };

  private _handleUnSelect = (e: MouseEvent, id: string) => {
    // 正在移动过程中不处理
    if (id !== this.id || axis?.isMoved) {
      return;
    }

    const { onUnSelect } = this.eventHandlers;
    if (onUnSelect) {
      onUnSelect(e, this);
    } else {
      console.warn('Implement me!');
    }
  };

  public get bbox() {
    return this.group.bbox;
  }

  public render(_ctx: CanvasRenderingContext2D) {
    this.group.render(_ctx);
  }

  public destroy() {
    this.data = null as any;
    this.group.destroy();
    eventEmitter.off(EInternalEvent.Select, this._handleSelect);
    eventEmitter.off(EInternalEvent.UnSelect, this._handleUnSelect);
  }
}
