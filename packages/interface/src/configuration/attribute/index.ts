export interface AttributeItem {
  key: string;
  value: string;
}

export interface AttributeOption extends AttributeItem {
  isDefault?: boolean;
}

export interface Attribute extends AttributeItem {
  color: string;
  attributes?: InnerAttribute[];
}

export interface TextAttribute {
  key: string;
  value: string;
  type: InnerAttributeType[keyof InnerAttributeType];
  maxLength?: number;
  regexp?: string;
  stringType: StringType[keyof StringType];
  required?: boolean;
  defaultValue?: string;
}

export interface EnumerableAttribute extends AttributeItem {
  type: InnerAttributeType[keyof InnerAttributeType];
  options: AttributeOption[];
}

export type InnerAttribute = TextAttribute | EnumerableAttribute;

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
