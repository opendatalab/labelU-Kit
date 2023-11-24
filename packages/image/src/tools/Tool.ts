import type { Attribute } from '@labelu/interface';

import type { Axis, RBushItem } from '../core/Axis';

export const TOOL_HOVER = 'tool:hover';

export interface BasicToolParams<Data, Style> {
  /** 标签配置 */
  labels?: Attribute[];
  data?: Data[];

  style?: Style;
}

export class Tool<Data, Style, Config extends BasicToolParams<Data, Style>> {
  public defaultColor: string = '#000';

  public labelMapping: Map<string, Attribute> = new Map();

  public data?: Data[] = [];

  public config: Omit<Config, 'data' | 'style'>;

  public style?: Style;

  public axis: Required<Axis>;

  public rbushElementMapping: Map<string, RBushItem> = new Map();

  /**
   * 非编辑模式下的图形对象
   */
  public staticObjects: any[] = [];

  constructor({ data, style, ...config }: Config, axis: Axis) {
    // 创建标签映射
    this._createLabelMapping(config as Omit<Config, 'data' | 'style'>);
    this.config = config as Omit<Config, 'data' | 'style'>;
    this.data = data;
    this.axis = axis;

    if (style) {
      this.style = style;
    }
  }

  private _createLabelMapping(config: Omit<Config, 'data' | 'style'>) {
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
   *
   * @param label 标签
   */
  public pen(label: string | Attribute): void;
  public pen() {}

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
    this.rbushElementMapping.forEach((item) => {
      this.axis.rbush.remove(item);
    });
    this.rbushElementMapping.clear();
  }
}
