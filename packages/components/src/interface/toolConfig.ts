import type { ToolConfig, cTool, Attribute, EToolName } from '@label-u/annotation';

export type { ToolConfig } from '@label-u/annotation';
export type { PolygonConfig } from '@label-u/annotation';
export type { TagToolConfig } from '@label-u/annotation';
export type { LineToolConfig } from '@label-u/annotation';
export type { OneTag } from '@label-u/annotation';
export type { RectConfig } from '@label-u/annotation';
export type { TextToolConfig } from '@label-u/annotation';
export type { Attribute } from '@label-u/annotation';

export interface StepConfig {
  step: number;
  dataSourceStep: number;
  tool: cTool.ToolNameType;
  config: ToolConfig;
}

export interface StepConfigState {
  stepConfig: StepConfig[];
}

export interface BasicConfig {
  tool: string;
  config: ToolConfig;
}

export type ToolNameType = EToolName[keyof EToolName];

export interface LabelUAnnotationConfig {
  commonAttributeConfigurable?: boolean;
  attributes?: Attribute[];
  drawOutsideTarget?: boolean;
  tools: BasicConfig[];
}

export enum StringType {
  Text = 'text',
  Number = 'number',
  Order = 'order',
  Regexp = 'regexp',
  English = 'english',
}

export enum CategoryType {
  Enum = 'enum',
  Array = 'array',
  String = 'string',
}

export interface IConfigListItem {
  key: string;
  value: string;
  type: keyof typeof CategoryType;
  maxLength: number;
  stringType: keyof typeof StringType;
  required?: boolean;
  defaultValue?: string;
}

export type TextConfig = IConfigListItem[];

type FileType = 'img' | 'video' | 'aodio' | 'text';

export interface FileInfo {
  type: FileType;
  list: [
    {
      id: number;
      url: string;
      result: object;
    },
  ];
}
