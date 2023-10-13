import type { AttributeValue } from '../../base';
import type { AnnotationWrapper } from '../../utils';

/**
 * 文本描述标注类型
 */
export type TextAnnotationType = 'text';

/**
 * 标签分类标注类型
 */
export type TagAnnotationType = 'tag';

/**
 * 全局标注类型，包含文本描述和标签分类
 */
export type GlobalAnnotationType = TextAnnotationType | TagAnnotationType;

/**
 * 标签分类标注数据内容，不包含type和id
 */
export type TagAnnotationData = AttributeValue;

/**
 * 文本描述标注数据内容，不包含type和id
 */
export type TextAnnotationData = AttributeValue;

/**
 * 标签分类标注数据
 *
 * @see {@link AnnotationWrapper}
 */
export type TagAnnotationEntity = AnnotationWrapper<TagAnnotationType, TagAnnotationData>;

/**
 * 文本描述标注数据
 *
 * @see {@link AnnotationWrapper}
 */
export type TextAnnotationEntity = AnnotationWrapper<TextAnnotationType, TextAnnotationData>;
