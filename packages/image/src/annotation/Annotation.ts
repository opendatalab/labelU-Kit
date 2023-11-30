import type { BBox } from 'rbush';

import type { BasicImageAnnotation } from '../interface';
import { Group } from '../shape/Group';
import { Point, type Shape } from '../shape';
import { EInternalEvent } from '../enums';
import { eventEmitter } from '../singletons';

export interface IAnnotation<Data extends BasicImageAnnotation> {
  id: string;

  data: Data;

  getBBox: () => BBox;

  render: (ctx: CanvasRenderingContext2D) => void;

  destroy: () => void;
}

export class Annotation<Data extends BasicImageAnnotation, IShape extends Shape<Style>, Style>
  implements IAnnotation<Data>
{
  public id: string;

  public data: Data;

  public style: Style;

  public group: Group<IShape, Style>;

  public hoveredStyle?: Style;

  public get isHovered() {
    return false;
  }

  constructor(id: string, data: Data, style: Style, hoveredStyle?: Style) {
    this.id = id;
    this.data = data;
    this.style = style;
    this.hoveredStyle = hoveredStyle;
    this.group = new Group(id, data.order);

    this.group.on(EInternalEvent.BBoxOver, this._handleMouseOver);
    this.group.on(EInternalEvent.BBoxOut, this._handleMouseOut);
    eventEmitter.on(EInternalEvent.NoTarget, this._handleMouseOut);
  }

  private _handleMouseOver = () => {
    const { group, style, hoveredStyle } = this;

    group.updateStyle({
      ...style,
      ...(hoveredStyle ?? {}),
    });
  };

  private _handleMouseOut = () => {
    const { group, style } = this;

    if (group.shapes[0] instanceof Point) {
      console.log('Point out');
    }

    group.updateStyle(style);
  };

  public getBBox() {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    };
  }

  public render(_ctx: CanvasRenderingContext2D) {
    console.warn('Implement me!');
  }

  public destroy() {
    this.data = null as any;
    this.group.destroy();
    eventEmitter.off(EInternalEvent.NoTarget, this._handleMouseOut);
  }
}
