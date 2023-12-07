import type { BasicImageAnnotation } from '../interface';
import { Group } from '../shapes/Group';
import { type Shape } from '../shapes';
import { EInternalEvent } from '../enums';
import { eventEmitter, monitor } from '../singletons';

// TODO: 去除本类的any
export interface AnnotationParams<Data extends BasicImageAnnotation, Style> {
  id: string;
  data: Data;
  style: Style;
  hoveredStyle?: Style | ((style: Style) => Style);

  onBBoxOver?: (e: MouseEvent, annotation: any) => void;
  onBBoxOut?: (e: MouseEvent, annotation: any) => void;
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
    onBBoxOver,
    onBBoxOut,
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

    this.eventHandlers = {
      onBBoxOver,
      onBBoxOut,
      onSelect,
      onUnSelect,
      onMove,
      onMoveEnd,
      onPick,
    };

    this.group = new Group(id, data.order);

    // hover事件挂在group上即可满足当前需求
    this.group.on(EInternalEvent.BBoxOver, this._handleMouseOver);
    this.group.on(EInternalEvent.BBoxOut, this._handleMouseOut);

    eventEmitter.on(EInternalEvent.Select, this._handleSelect);
    eventEmitter.on(EInternalEvent.UnSelect, this._handleUnSelect);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);

    // 建立order和id的映射关系
    monitor?.setOrderIndexedAnnotationIds(data.order, id);
  }

  private _handleSelect = (e: MouseEvent, id: string) => {
    if (id !== this.id) {
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
    if (id !== this.id) {
      return;
    }

    const { onUnSelect } = this.eventHandlers;
    if (onUnSelect) {
      onUnSelect(e, this);
    } else {
      console.warn('Implement me!');
    }
  };

  private _handleMouseOver = (e: MouseEvent) => {
    const { onBBoxOver } = this.eventHandlers;

    if (onBBoxOver) {
      onBBoxOver(e, this);
    } else {
      const { group, style, hoveredStyle } = this;

      group.updateStyle({
        ...style,
        ...(typeof hoveredStyle === 'function' ? (hoveredStyle as (style: Style) => Style)(style) : hoveredStyle ?? {}),
      });
    }
  };

  private _handleMouseOut = (e: MouseEvent) => {
    const { onBBoxOut } = this.eventHandlers;

    if (onBBoxOut) {
      onBBoxOut(e, this);
    } else {
      const { group, style } = this;

      group.updateStyle(style);
    }
  };

  public get bbox() {
    return this.group.bbox;
  }

  public syncCoordToData() {
    throw Error('Implement me!');
  }

  public render(_ctx: CanvasRenderingContext2D) {
    this.group.render(_ctx);
  }

  public destroy() {
    this.data = null as any;
    this.group.destroy();
    eventEmitter.off(EInternalEvent.Select, this._handleSelect);
    eventEmitter.off(EInternalEvent.UnSelect, this._handleUnSelect);
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
