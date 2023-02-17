import { Attribute, OneTag } from '@label-u/annotation';
import { BasicConfig, TextConfig, FileInfo } from '@label-u/components';

export type { ToolConfig } from '@label-u/annotation';
export type { PolygonConfig } from '@label-u/annotation';
export type { TagToolConfig } from '@label-u/annotation';
export type { LineToolConfig } from '@label-u/annotation';
export type { OneTag } from '@label-u/annotation';
export type { RectConfig } from '@label-u/annotation';
export type { TextToolConfig } from '@label-u/annotation';
export type { Attribute } from '@label-u/annotation';
export type { BasicConfig } from '@label-u/components';
export type { TextConfig } from '@label-u/components';

export interface ToolsConfigState {
  fileInfo: FileInfo;
  tools: BasicConfig[];
  tagList: OneTag[];
  attribute: Attribute[];
  textConfig: TextConfig;
}
