import type { MonitorOption } from '../core/Monitor';
import { Monitor } from '../core/Monitor';

let monitor: Monitor | null = null;

export function createMonitor(canvas: HTMLCanvasElement, options: MonitorOption) {
  monitor = new Monitor(canvas, options);

  return monitor;
}

export { monitor };
