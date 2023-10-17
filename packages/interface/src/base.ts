/**
 * 属性值或文本描述、标签分类的值内容
 *
 * @description 属性值是一个字符串或字符串数组，用于描述一个标注的属性。当表单项是单选时为字符串；复选时为字符串数组。
 *
 * @example ```{ "color": "red" }```、```{ "color": ["red", "blue"] }```
 */
export type AttributeValue = Record<string, string | string[]>;

/** 标签值，包含标签属性值 */
export interface LabelValue {
  /** 标签id，通常为英文字符 */
  label: string;
  /** 标签属性值 */
  attributes?: AttributeValue;
}
