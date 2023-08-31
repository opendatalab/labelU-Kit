/**
 * 属性值或文本描述、标签分类的值内容
 */
export type AttributeValue = Record<string, string | string[]>;

/**
 * 标签值，包含标签属性值
 */
export interface LabelValue {
  label: string;
  attributes?: AttributeValue;
}
