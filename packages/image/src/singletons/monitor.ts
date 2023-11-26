import { Monitor } from '../core/Monitor';
import type { Annotator } from '../ImageAnnotator';

let monitor: Monitor | null = null;

export function createAxis(annotator: Annotator) {
  monitor = new Monitor(annotator);

  return monitor;
}

export { monitor };
