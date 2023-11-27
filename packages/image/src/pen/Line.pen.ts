import { Pen } from './Pen';
import type { Line, LineStyle } from '../shape/Line.shape';
import type { LineTool } from '../tools/Line.tool';
import type { LineData } from '../annotation';
import type { Group } from '../shape/Group';
import type { Rect, Point, PointStyle } from '../shape';

export class LinePen<T extends LineTool> extends Pen<T, LineData> {
  /**
   * 选框图形
   */
  private _selectionShape: Rect | null = null;

  public group: Group<Line | Point, LineStyle | PointStyle> | null = null;

  public render(ctx: CanvasRenderingContext2D) {
    const { group } = this;

    if (group) {
      group.render(ctx);
    }

    if (this._selectionShape) {
      this._selectionShape.render(ctx);
    }
  }

  public destroy() {
    this.group?.destroy();
  }
}
