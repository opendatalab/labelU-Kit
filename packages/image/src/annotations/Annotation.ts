import type { BasicImageAnnotation } from '../interface';
import { Group } from '../shapes/Group';
import { type Shape } from '../shapes';
import { monitor } from '../singletons';
import { DEFAULT_LABEL_COLOR } from '../constant';

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

  public labelColor: string = DEFAULT_LABEL_COLOR;

  public strokeColor: string = DEFAULT_LABEL_COLOR;

  static strokeOpacity = 0.9;

  static fillOpacity = 0.7;

  static strokeWidth = 2;

  public get isHovered() {
    return false;
  }

  constructor({ id, data, style, hoveredStyle, showOrder }: AnnotationParams<Data, Style>) {
    this.id = id;
    this.data = data;
    this.style = style;
    this.hoveredStyle = hoveredStyle;
    this.showOrder = showOrder;

    this.group = new Group(id, data.order);

    // 建立order和id的映射关系
    monitor?.setOrderIndexedAnnotationIds(data.order, id);
  }

  public get bbox() {
    return this.group.bbox;
  }

  public render(_ctx: CanvasRenderingContext2D) {
    this.group.render(_ctx);
  }

  public destroy() {
    this.data = null as any;
    this.group.destroy();
  }
}
