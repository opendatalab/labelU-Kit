import type { EToolName } from '@/constant/tool';

export interface CommonToolConfig {
  commonAttributeConfigurable?: boolean;
  attributes?: Attribute[];
  drawOutsideTarget?: boolean;
}

export interface AttributeItem {
  key: string;
  value: string;
}

export interface AttributeOption extends AttributeItem {
  isDefault: boolean;
}

export interface Attribute extends AttributeItem {
  color: string;
  attributes?: InnerAttribute[];
}

export interface TextAttribute {
  key: string;
  value: string;
  type: InnerAttributeType[keyof InnerAttributeType];
  maxLength: number;
  stringType: keyof typeof StringType;
  required?: boolean;
  defaultValue?: string;
}

export interface EnumerableAttribute extends AttributeItem {
  type: InnerAttributeType;
  options: AttributeOption[];
}

export type InnerAttribute = TextAttribute | EnumerableAttribute;

export interface RectToolConfig {
  drawOutsideTarget: boolean;
  minWidth: number;
  minHeight: number;
  isShowOrder: boolean;
  attributeConfigurable: boolean;
  attributes: Attribute[];
}

export interface PointToolConfig {
  isShowOrder: boolean;
  attributeConfigurable: boolean;
  attributes: Attribute[];
  upperLimit: number;
}

export interface LineToolConfig {
  lineType: number;
  edgeAdsorption: boolean;
  isShowOrder: boolean;
  attributeConfigurable: boolean;
  attributes: Attribute[];
  lowerLimitPointNum: number;
  upperLimitPointNum: string;
}

export interface PolygonConfig {
  edgeAdsorption: boolean;
  isShowOrder: boolean;
  attributeConfigurable: true;
  attributes: Attribute[];
}

export interface TextToolConfig {
  attributes: TextAttribute[];
}

export interface TagToolConfig {
  attributes: EnumerableAttribute[];
}

export type ToolConfig =
  | RectToolConfig
  | PointToolConfig
  | LineToolConfig
  | PolygonConfig
  | TextToolConfig
  | TagToolConfig;

export interface BasicConfig {
  tool: string;
  config: ToolConfig;
}

export type ToolNameType = EToolName[keyof EToolName];

export interface LabelUAnnotationConfig extends CommonToolConfig {
  tools: BasicConfig[];
}

export enum StringType {
  Text = 'text',
  Number = 'number',
  Order = 'order',
  Regexp = 'regexp',
  English = 'english',
}

export enum InnerAttributeType {
  Enum = 'enum',
  Array = 'array',
  String = 'string',
}

export type TextConfig = TextAttribute[];

type FileType = 'img' | 'video' | 'audio' | 'text';

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
