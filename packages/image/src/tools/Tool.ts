import type { Attribute } from '@labelu/interface';
import EventEmitter from 'eventemitter3';

import type { Axis } from '../core/Axis';

export const TOOL_HOVER = 'tool:hover';

export interface BasicToolParams<Data> {
  /** 标签配置 */
  labels?: Attribute[];
  data?: Data[];
}

export class Tool<Data, Config extends BasicToolParams<Data>> extends EventEmitter {
  public defaultColor: string = '#000';

  public labelMapping: Map<string, Attribute> = new Map();

  public data?: Data[] = [];

  public config: Omit<Config, 'data'>;

  public axis: Axis;
  constructor(data: Data[] | undefined, config: Config, axis: Axis) {
    super();
    // 创建标签映射
    this._createLabelMapping(config);
    this.config = config;
    this.data = data;
    this.axis = axis;
  }

  private _createLabelMapping(config: Config) {
    const { labels } = config as Config;

    if (!labels) {
      return;
    }

    for (const label of labels) {
      this.labelMapping.set(label.value, label);
    }
  }
}
