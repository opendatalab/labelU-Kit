/**
 * 标注数据结构体的工具类型
 *
 * @param Type 标注类型
 * @param ValueType 标注值类型
 *
 * @description 通常在全局使用的标注数据结构体，包含标注的基本信息。
 *
 * @example 标签分类、文本描述。
 *
 * @see {@link TagAnnotationEntity}
 * @see {@link TextAnnotationEntity}
 */
export interface AnnotationWrapper<Type, ValueType> {
  /**
   * 标注id
   */
  id: string;
  /**
   * 标注类型
   */
  type: Type;
  /**
   * 标注值
   */
  value: ValueType;
}
