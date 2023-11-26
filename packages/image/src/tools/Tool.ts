import type { Attribute } from '@labelu/interface';

import type { Drawing } from '../drawing/Drawing.abstract';
import type { Pen } from '../pen/Pen';

export const TOOL_HOVER = 'tool:hover';

export interface BasicToolParams<Data, Style> {
  /** 标签配置 */
  labels?: Attribute[];
  data?: Data[];

  style?: Style;

  hoveredStyle?: Style;
}

type ConfigOmit<T> = Omit<T, 'data' | 'style' | 'hoveredStyle'>;

abstract class AbsTool<Data, Style, Config extends BasicToolParams<Data, Style>, Annotation> {
  abstract labelMapping: Map<string, Attribute>;
  abstract data?: Data[];
  abstract config: ConfigOmit<Config>;
  abstract style: Style;
  abstract hoverStyle?: Style;
  abstract pen: Pen<AbsTool<Data, Style, Config, Annotation>, Data> | null;
  abstract drawing: Drawing<Data, AbsTool<Data, Style, Config, Annotation>, Annotation> | null;

  // 抽象方法，子类中必须实现
  abstract _createLabelMapping(config: ConfigOmit<Config>): void;
}

/**
 * 工具基类
 */
export class Tool<Data, Style, Config extends BasicToolParams<Data, Style>, Annotation>
  implements AbsTool<Data, Style, Config, Annotation>
{
  public defaultColor: string = '#000';

  public labelMapping: Map<string, Attribute> = new Map();

  public data?: Data[] = [];

  public style: Style = {} as Style;

  public config: ConfigOmit<Config>;

  public hoverStyle?: Style;

  /** 当前工具的画笔 */
  public pen: Pen<Tool<Data, Style, Config, Annotation>, Data> | null = null;

  /**
   * 当前工具非编辑状态的成品（称为制品）
   *
   * TODO: 获取有更好的名字？
   */

  public drawing: Drawing<Data, Tool<Data, Style, Config, Annotation>, Annotation> | null = null;

  constructor({ data, style, hoveredStyle, ...config }: Config) {
    // 创建标签映射
    this._createLabelMapping(config as ConfigOmit<Config>);
    this.config = config as ConfigOmit<Config>;
    this.data = data;

    if (style) {
      this.style = style;
    }

    if (hoveredStyle) {
      this.hoverStyle = hoveredStyle;
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

  /**
   * 工具进入绘制模式
   * NOTE: 需要在各自的工具类中实现
   * @param label 标签
   */
  public switchToPen(label: string | Attribute): void;
  public switchToPen() {
    console.log('Please implement switchToPen method in your tool');
  }

  public getLabelByValue(value: string | undefined) {
    if (typeof value !== 'string') {
      console.warn('value is not a string', value);
      return undefined;
    }

    return this.labelMapping.get(value);
  }

  public updateStyle(style: Style) {
    this.style = { ...this.style, ...style };
  }

  public destroy(): void;
  public destroy(): void {
    console.log('Please implement destroy method in your tool');
  }
}
