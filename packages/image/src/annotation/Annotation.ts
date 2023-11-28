import type { BBox } from 'rbush';

import type { BasicImageAnnotation } from '../interface';

export interface IAnnotation<Data extends BasicImageAnnotation> {
  id: string;

  data: Data;

  getBBox: () => BBox;

  render: (ctx: CanvasRenderingContext2D) => void;

  destroy: () => void;

  readonly isHovered: boolean;

  /** 对比标注顺序之后悬浮的标识 */
  hovered: boolean;
}

export class Annotation<Data extends BasicImageAnnotation, Style> implements IAnnotation<Data> {
  public id: string;

  public data: Data;

  public style: Style;

  public hoveredStyle?: Style;

  public hovered: boolean = false;

  public get isHovered() {
    return false;
  }

  constructor(id: string, data: Data, style: Style, hoveredStyle?: Style) {
    this.id = id;
    this.data = data;
    this.style = style;
    this.hoveredStyle = hoveredStyle;
  }

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
  }
}
