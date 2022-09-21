import { Attribute, OneTag } from '@label-u/lb-annotation';
import { BasicConfig, TextConfig, FileInfo } from '@label-u/lb-components';

export type { ToolConfig } from '@label-u/lb-annotation';
export type { PolygonConfig } from '@label-u/lb-annotation';
export type { tagToolConfig } from '@label-u/lb-annotation';
export type { LineToolConfig } from '@label-u/lb-annotation';
export type { OneTag } from '@label-u/lb-annotation';
export type { RectConfig } from '@label-u/lb-annotation';
export type { TextToolConfig } from '@label-u/lb-annotation';
export type { Attribute } from '@label-u/lb-annotation';
export type { BasicConfig } from '@label-u/lb-components';
export type { TextConfig } from '@label-u/lb-components';

export interface ToolsConfigState {
  fileInfo: FileInfo;
  tools: BasicConfig[];
  tagList: OneTag[];
  attribute: Attribute[];
  textConfig: TextConfig;
}
