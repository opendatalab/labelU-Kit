import type { Annotator } from '../ImageAnnotator';
import { Axis } from '../core/Axis';

let axis: Axis | null = null;

export function createAxis(annotator: Annotator) {
  axis = new Axis(annotator);

  return axis;
}

export { axis };
