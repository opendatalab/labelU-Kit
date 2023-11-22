import type { Attribute } from '@labelu/interface';
import EventEmitter from 'eventemitter3';

import type { Axis } from '../core/Axis';

export const TOOL_HOVER = 'tool:hover';

export interface BasicToolParams<Data, Style> {
  /** 标签配置 */
  labels?: Attribute[];
  data?: Data[];

  style?: Style;
}

export class Tool<Data, Style, Config extends BasicToolParams<Data, Style>> extends EventEmitter {
  public defaultColor: string = '#000';

  public labelMapping: Map<string, Attribute> = new Map();

  public data?: Data[] = [];

  public config: Omit<Config, 'data' | 'style'>;

  public style?: Style;

  public axis: Required<Axis>;

  constructor({ data, style, ...config }: Config, axis: Axis) {
    super();
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

  public getLabelByValue(value: string | undefined) {
    if (typeof value !== 'string') {
      console.warn('value is not a string', value);
      return undefined;
    }

    return this.labelMapping.get(value);
  }
}
