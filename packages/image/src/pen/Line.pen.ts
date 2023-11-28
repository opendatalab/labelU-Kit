import { Pen } from './Pen';
// import type { LineData } from '../annotation';
import { AnnotationLine } from '../annotation';
import type { LineStyle } from '../shape';

export class LinePen extends Pen<AnnotationLine, LineStyle> {
  public select(annotation: AnnotationLine) {
    const { hoveredStyle } = this;

    if (this.draft) {
      this.draft.destroy();
    }

    const { id, data, style: _style } = annotation;

    this.draft = new AnnotationLine(id, data, { ..._style, stroke: this.getLabelColor(data.label) }, hoveredStyle);
  }
}
