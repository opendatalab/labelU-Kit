import type { Attribute } from '@labelu/interface';

import type { IDrawing } from '../drawing/Drawing';
import type { Pen } from '../pen/Pen';

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

export interface IAnnotationTool<Data, Style, Config extends BasicToolParams<Data, Style>, Annotation> {
  labelMapping: Map<string, Attribute>;
  data?: Data[];
  config: ConfigOmit<Config>;
  style: Required<Style>;
  hoveredStyle?: Style;

  selectedStyle?: Style;

  activatedAnnotation: Annotation | null;
  /** 当前工具的画笔 */
  pen: Pen<IAnnotationTool<Data, Style, Config, Annotation>, Data> | null;

  /**
   * 当前工具非编辑状态的成品（称为制品）
   *
   * TODO: 获取有更好的名字？
   */
  drawing: IDrawing<Data, IAnnotationTool<Data, Style, Config, Annotation>> | null;

  // 抽象方法，子类中必须实现
  _createLabelMapping: (config: ConfigOmit<Config>) => void;

  /**
   * 创建绘制器，进入绘制模式
   *
   * @example
   *
   * `lineTool.switchToPen('person')`
   * `lineTool.switchToPen({ value: 'person' })`
   */
  switchToPen?: (label: string | Attribute) => void;

  /**
   * 退出绘制模式
   */
  dropThePen?: () => void;

  /** 根据label标签的value值获取label对象 */
  getLabelByValue: (value: string | undefined) => Attribute | undefined;

  /** 更新样式 */
  updateStyle: (style: Style) => void;

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
  createDrawing?: (data?: Data[]) => void;
}

/**
 * 工具基类
 */
export class Tool<Data, Style, Config extends BasicToolParams<Data, Style>, Annotation>
  implements IAnnotationTool<Data, Style, Config, Annotation>
{
  public defaultColor = '#000';

  public labelMapping = new Map();

  public data;

  public style = {} as Required<Style>;

  public config;

  public pen: Pen<IAnnotationTool<Data, Style, Config, Annotation>, Data> | null = null;

  public drawing: IDrawing<Data, IAnnotationTool<Data, Style, Config, Annotation>> | null = null;

  public activatedAnnotation: Annotation | null = null;

  public hoveredStyle = {} as Style;

  public selectedStyle = {} as Style;

  constructor({ data, style, hoveredStyle, selectedStyle, ...config }: Config) {
    // 创建标签映射
    this._createLabelMapping(config as ConfigOmit<Config>);
    this.config = config as ConfigOmit<Config>;
    this.data = data;

    console.log('style', style);
    if (style) {
      this.style = {
        ...this.style,
        ...style,
      };
    }

    if (hoveredStyle) {
      this.hoveredStyle = hoveredStyle;
    }

    if (selectedStyle) {
      this.selectedStyle = selectedStyle;
    }
  }

  _createLabelMapping(config: ConfigOmit<Config>) {
    const { labels } = config as Config;

    if (!labels) {
      return;
    }

    for (const label of labels) {
      this.labelMapping.set(label.value, label);
    }
  }

  public getLabelByValue(value: string | undefined) {
    if (typeof value !== 'string') {
      console.warn('value is not a string', value);
      return undefined;
    }

    return this.labelMapping.get(value);
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
    console.log('updateStyle', style);
    this.style = { ...this.style, ...style };
  }

  public destroy(): void;
  public destroy(): void {
    this.pen?.destroy();
    this.drawing?.destroy();
    this.pen = null;
    this.drawing = null;
  }
}
