import { Monitor } from '../core/Monitor';

let monitor: Monitor | null = null;

export function createMonitor(canvas: HTMLCanvasElement) {
  monitor = new Monitor(canvas);

  return monitor;
}

export { monitor };
