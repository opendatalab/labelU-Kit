import { CursorManager } from '@/core/CursorManager';
import type { AxisPoint } from '@/shapes';

let cursorManager: CursorManager | null = null;

export function createCursorManager(container: HTMLDivElement | null, coordinate: AxisPoint, color?: string) {
  cursorManager = CursorManager.getInstance(container, coordinate, color);

  return cursorManager;
}

export { cursorManager };
