import type { ILabel } from '@labelu/interface';

import { eventEmitter } from '../singletons';
import { Pen } from './Pen';
import { EInternalEvent } from '../enums';
import type { Line, LineStyle } from '../shape/Line.shape';
import type { PointTool } from '../tools/Point.tool';
import type { AnnotationLine } from '../annotation';
import { Group } from '../shape/Group';
import type { Point, PointStyle } from '../shape';
import type { PointData } from '../annotation/Point.annotation';

export class PointPen<T extends PointTool> extends Pen<T, PointData> {
  /**
   * 选中的标注
   * @description 用于整个标注对象高亮等
   */
  private _selectedLines: Line[] | undefined = undefined;

  public group: Group<Line | Point, LineStyle | PointStyle> | null = null;

  public activatedAnnotation: AnnotationLine | null = null;

  constructor(tool: T, label: ILabel | string) {
    super(tool, label);

    eventEmitter.on(EInternalEvent.Select, this._onSelected.bind(this));
    eventEmitter.on(EInternalEvent.UnSelect, this._onUnSelect.bind(this));
  }

  /**
   * 点击画布事件处理
   *
   * @description
   * 点击标注时：
   * 1. 销毁被点击的标注的drawing（成品）
   * 2. 进入pen的编辑模式
   *  2.1. 创建新的drawing（成品），需要包含点、线
   *  2.2. 创建选中包围盒
   */
  private _onSelected(annotation: AnnotationLine) {
    this.group = new Group(annotation.id);
    console.log('selected', annotation);
  }

  private _onUnSelect() {
    this.group?.destroy();
    this.group = null;
  }

  public render(ctx: CanvasRenderingContext2D) {
    console.log(this._selectedLines, ctx);
  }

  public destroy() {
    this.group?.destroy();
  }
}
