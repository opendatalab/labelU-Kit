import { Monitor } from '../core/Monitor';

let monitor: Monitor | null = null;

export function createAxis(canvas: HTMLCanvasElement) {
  monitor = new Monitor(canvas);

  return monitor;
}

export { monitor };
