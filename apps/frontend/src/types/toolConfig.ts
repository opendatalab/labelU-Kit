import type { Attribute, OneTag } from '@label-u/annotation';
import type { BasicConfig, TextConfig } from '@label-u/components';

export interface ToolsConfigState {
  tools: BasicConfig[];
  tagList: OneTag[];
  attribute: Attribute[];
  textConfig: TextConfig;
  commonAttributeConfigurable: boolean;
}
