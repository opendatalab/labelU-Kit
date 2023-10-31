/**
 * 标签的基础信息
 */
export interface AttributeItem {
  /** 控制标签属性显隐性的条件 */
  conditions?: ConditionItem[];
  /** 是否必填 */
  required?: boolean;
  /** 标签名称 */
  key: string;
  /** 标签值，通常为英文字符 */
  value: string;
}

/**
 * 标签配置中的选项
 */
export interface AttributeOption extends AttributeItem {
  /** 是否默认选中 */
  isDefault?: boolean;
}

/**
 * 标签配置中的属性
 */
export interface Attribute extends AttributeItem {
  /** 标签属性的颜色 */
  color: string;
  /** 标签属性列表 */
  attributes?: InnerAttribute[];
}

/**
 * 文本类型控件的定义
 */
export interface TextAttribute extends AttributeItem {
  /** 文本描述输入类型 */
  type: InnerAttributeType.String;
  /** 最大字符长度 */
  maxLength?: number;
  /**
   * 字符的正则表达式规则
   *
   * @description 仅当type为regexp时有效
   */
  regexp?: string;
  /** 字符串类型 */
  stringType: 'text' | 'number' | 'order' | 'regexp' | 'english';
  /**
   * 默认值
   *
   * @description 仅当type为text时有效
   */
  defaultValue?: string;
}

/**
 * 标签属性选择控件的定义
 *
 * @description 通常为单选或多选
 */
export interface EnumerableAttribute extends AttributeItem {
  /** 选择控件的类型 */
  type: 'enum' | 'array';
  /** 标签的所有选项 */
  options: AttributeOption[];
}

/** 标签属性的类型 */
export type InnerAttribute = TextAttribute | EnumerableAttribute;

/**
 * 文本类型下的字符串枚举类型
 */
export enum StringType {
  /** 任意文本 */
  Text = 'text',
  /** 数字 */
  Number = 'number',
  /** 序号 */
  Order = 'order',
  /** 正则表达式 */
  Regexp = 'regexp',
  /** 英文字符串 */
  English = 'english',
}

/** 标签属性表单控件的类型 */
export enum InnerAttributeType {
  /** 单选 */
  Enum = 'enum',
  /** 多选 */
  Array = 'array',
  /** 文本类型 */
  String = 'string',
}

/**
 * 条件值内容
 */
export interface ConditionContent {
  /** 依赖的属性的值  */
  field: string;
  /** 依赖的属性选项的值 */
  value: string;
  option_id: string;
  question_id: string;
  /**
   * 运算符
   *
   * @description eq 等于；neq 不等于；in 包含；nin 不包含
   */
  operator: 'eq' | 'neq' | 'in' | 'nin';
}

/**
 * 标签属性表单中的表单项支持根据条件显示或隐藏
 */
export interface ConditionItem {
  /** 条件连接符 */
  connector: 'and' | 'or';
  /** 条件内容 */
  items: ConditionContent[];
  /** 子条件 */
  children: ConditionItem[];
}
