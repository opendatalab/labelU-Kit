import { Pen } from './Pen';
import type { PointStyle } from '../shape';
// import type { PointData } from '../annotation/Point.annotation';
import { AnnotationPoint } from '../annotation/Point.annotation';

export class PointPen extends Pen<AnnotationPoint, PointStyle> {
  public select(annotation: AnnotationPoint) {
    const { style, hoveredStyle, selectedStyle } = this;

    if (this.draft) {
      this.draft.destroy();
    }

    this.draft = new AnnotationPoint(annotation.id, annotation.data, { ...style, ...selectedStyle }, hoveredStyle);
  }
}
