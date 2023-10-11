import type { Attribute, OneTag } from '@labelu/annotation';
import type { BasicConfig, TextConfig } from '@labelu/components';

export interface ToolsConfigState {
  tools: BasicConfig[];
  tagList: OneTag[];
  attributes: Attribute[];
  textConfig: TextConfig;
  commonAttributeConfigurable: boolean;
}
