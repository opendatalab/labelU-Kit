import type { AttributeValue } from '../../base';
import type { AnnotationWrapper } from '../../utils';

export type TextAnnotationType = 'text';

export type TagAnnotationType = 'tag';

export type GlobalAnnotationType = TextAnnotationType | TagAnnotationType;

export type TagAnnotationData = AttributeValue;

export type TextAnnotationData = AttributeValue;

export type TagAnnotationEntity = AnnotationWrapper<TagAnnotationType, TagAnnotationData>;

export type TextAnnotationEntity = AnnotationWrapper<TextAnnotationType, TextAnnotationData>;
