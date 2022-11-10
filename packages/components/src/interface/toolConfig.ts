import { ToolConfig, cTool } from '@label-u/annotation';

export type { ToolConfig } from '@label-u/annotation';
export type { PolygonConfig } from '@label-u/annotation';
export type { tagToolConfig } from '@label-u/annotation';
export type { LineToolConfig } from '@label-u/annotation';
export type { OneTag } from '@label-u/annotation';
export type { RectConfig } from '@label-u/annotation';
export type { TextToolConfig } from '@label-u/annotation';
export type { Attribute } from '@label-u/annotation';

export interface StepConfig {
  step: number;
  dataSourceStep: number;
  tool: cTool.toolNameType;
  config: ToolConfig;
}

export interface StepConfigState {
  stepConfig: StepConfig[];
}

export interface BasicConfig {
  step?: number;
  dataSourceStep?: number;
  tool: string;
  config: ToolConfig;
}

export interface IConfigListItem {
  label: string;
  key: string;
  required: boolean;
  default: string;
  maxLength: number;
}

export type TextConfig = IConfigListItem[];

type fileType = 'img' | 'video' | 'aodio' | 'text';

export interface FileInfo {
  type: fileType;
  list: [
    {
      id: number;
      url: string;
      result: object;
    },
  ];
}
