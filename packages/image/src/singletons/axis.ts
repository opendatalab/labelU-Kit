import type { AxisParams } from '../core/Axis';
import { Axis } from '../core/Axis';

let axis: Axis | null = null;

export function createAxis(params: AxisParams) {
  axis = new Axis(params);

  return axis;
}

export { axis };
