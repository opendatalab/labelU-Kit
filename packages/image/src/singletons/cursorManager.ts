import { CursorManager } from '@/core/CursorManager';
import type { AxisPoint, CursorStyle } from '@/shapes';

let cursorManager: CursorManager | null = null;

export function createCursorManager(container: HTMLDivElement | null, coordinate: AxisPoint, style?: CursorStyle) {
  cursorManager = new CursorManager(container, coordinate, style);

  return cursorManager;
}

export { cursorManager };
