import { AnnotationCuboid } from './Cuboid.annotation';
import { AnnotationLine } from './Line.annotation';
import { AnnotationPoint } from './Point.annotation';
import { AnnotationPolygon } from './Polygon.annotation';
import { AnnotationRect } from './Rect.annotation';
import { AnnotationRelation } from './Relation.annotation';

export * from './Cuboid.annotation';
export * from './Polygon.annotation';
export * from './Rect.annotation';
export * from './Line.annotation';
export * from './Point.annotation';
export * from './Annotation';
export * from './Relation.annotation';

export const AnnotationMapping = {
  cuboid: AnnotationCuboid,
  polygon: AnnotationPolygon,
  rect: AnnotationRect,
  line: AnnotationLine,
  point: AnnotationPoint,
  relation: AnnotationRelation,
};
