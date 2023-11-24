import type { ILabel } from '@labelu/interface';
import type { BBox } from 'rbush';
import RBush from 'rbush';

import { Pen } from './Pen';
import type { LineData, LineTool, PointItem } from '../tools/LineTool';
import { EInternalEvent } from '../enums';
import type { RBushItem } from '../core/Axis';
import type { AxisPoint } from '../graphics/Point';
import type { Line } from '../graphics/Line';

export class LinePen<T extends LineTool> extends Pen<T, LineData> {
  /**
   * 选中的标注
   * @description 用于整个标注对象高亮等
   */
  private _selectedLines: Line[] | undefined = undefined;

  /**
   * 建立 rbush 索引，供选中后创建选框
   */
  private _rbush: RBush<RBushItem> | null = new RBush();

  private _bbox: BBox | null = null;

  private _selectedPoint: PointItem | null = null;
  constructor(tool: T, label: ILabel | string) {
    super(tool, label);

    this.tool?.axis.on(EInternalEvent.Click, this._onClick.bind(this));
  }

  private _onClick(e: MouseEvent, items: RBushItem[], mouseCoord: AxisPoint) {
    const annotationId = this.tool?.getAnnotationIdUnderCursor(mouseCoord, items);

    if (annotationId) {
      this._selectedLines = this.tool?.getAnnotation(annotationId);

      if (this._selectedLines) {
        this._bbox = this._getBBoxFromLines(this._selectedLines);
        this._createBBoxRect();

        this._rbush!.insert({
          type: 'line',
          id: annotationId,
          ...this._bbox,
        });
      }
    }
  }

  private _getBBoxFromLines(lines: Line[]) {
    const minX = Math.min(...lines.map((line) => line.getBBox().minX));
    const minY = Math.min(...lines.map((line) => line.getBBox().minY));
    const maxX = Math.max(...lines.map((line) => line.getBBox().maxX));
    const maxY = Math.max(...lines.map((line) => line.getBBox().maxY));

    return {
      minX,
      minY,
      maxX,
      maxY,
    };
  }

  private _createBBoxRect() {
    const { minX, minY, maxX, maxY } = this._bbox!;
    const { ctx } = this.tool!.axis.annotator!.renderer!;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'red';
    ctx.rect(minX, minY, maxX - minX, maxY - minY);
    ctx.stroke();
    ctx.restore();
  }

  public destroy() {
    this._rbush!.clear();
    this._selectedLines = undefined;
    this._rbush = null;
  }
}
