import type { OneTag } from '@labelu/annotation';
import type { BasicConfig, TextConfig } from '@labelu/components';
import type { Attribute } from '@labelu/interface';

export interface ToolsConfigState {
  tools: BasicConfig[];
  tagList: OneTag[];
  attributes: Attribute[];
  textConfig: TextConfig;
  commonAttributeConfigurable: boolean;
}
