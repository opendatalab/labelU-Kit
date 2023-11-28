import type { Attribute } from '@labelu/interface';

import type { Pen } from '../pen/Pen';
import type { BasicImageAnnotation } from '../interface';
import { BaseLabel } from '../drawing/BaseLabel';
import type { Drawing } from '../drawing/Drawing';

export const TOOL_HOVER = 'tool:hover';

export interface BasicToolParams<Data, Style> {
  /** 标签配置 */
  labels?: Attribute[];
  data?: Data[];

  /** 标注静止的样式 */
  style?: Style;

  /** 标注悬浮的样式 */
  hoveredStyle?: Style;

  /** 标注选中的样式 */
  selectedStyle?: Style;
}

type ConfigOmit<T> = Omit<T, 'data' | 'style' | 'hoveredStyle'>;

/**
 * 工具基类
 */
export class Tool<
  Data extends BasicImageAnnotation,
  Style,
  Config extends BasicToolParams<Data, Style>,
  Annotation,
> extends BaseLabel<Style> {
  public data: Data[];
  public config;

  public pen: Pen<Annotation, Style> | null = null;

  public drawing: Drawing<Data, Style> | null = null;

  public activatedAnnotation: Annotation | null = null;

  constructor({ data, style, hoveredStyle, selectedStyle, ...config }: Required<Config>) {
    super(config.labels, style as Style, hoveredStyle as Style, selectedStyle as Style);
    this.config = config as ConfigOmit<Config>;
    this.data = data || [];
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { drawing, pen } = this;

    if (drawing) {
      drawing.render(ctx);
    }

    if (pen) {
      pen.render(ctx);
    }
  }

  public updateStyle(style: Style) {
    this.style = { ...this.style, ...style };
  }

  /**
   * 创建成品图形
   *
   * @description 非编辑状态下的成品图形
   *
   * 调用时机：
   * 1. 当结束编辑后，调用此方法；
   * 2. 当切换工具时，调用此方法；
   * 3. 当初始化画面时，调用此方法；
   */
  createDrawing(_data?: Data[]) {
    throw Error('Implement createDrawing method');
  }

  public destroy(): void;
  public destroy(): void {
    this.pen?.destroy();
    this.drawing?.destroy();
    this.pen = null;
    this.drawing = null;
  }
}
